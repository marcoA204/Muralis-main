import { Point2D } from './homography.js';

export type WallDirection = 'left-to-right' | 'right-to-left' | 'frontal';

export interface GuideVectors {
  top: [Point2D, Point2D];
  bot: [Point2D, Point2D];
}

export interface WallPlane {
  topLine: { m: number; c: number };
  botLine: { m: number; c: number };
  wallLeftX: number;
  wallRightX: number;
  wallTopY: number;
  wallBotY: number;
  slope: number;
  confidence: number;
  direction: WallDirection;
  depthRatio: number;
  textureRoughness: number;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function bilerpQuad(
  quad: [Point2D, Point2D, Point2D, Point2D],
  u: number,
  v: number
): Point2D {
  const [tl, tr, br, bl] = quad;
  const topX = tl.x + (tr.x - tl.x) * u;
  const topY = tl.y + (tr.y - tl.y) * u;
  const botX = bl.x + (br.x - bl.x) * u;
  const botY = bl.y + (br.y - bl.y) * u;
  return {
    x: Number(clamp(topX + (botX - topX) * v, 0.01, 0.99).toFixed(4)),
    y: Number(clamp(topY + (botY - topY) * v, 0.01, 0.99).toFixed(4))
  };
}

function fitRansacLine(
  points: Array<{ x: number; y: number; weight: number }>,
  fallbackY: number,
  maxSlope = 1.2
): { m: number; c: number; inliers: number } {
  if (points.length < 3) {
    return { m: 0, c: fallbackY, inliers: 0 };
  }

  let bestM = 0;
  let bestC = fallbackY;
  let bestScore = -1;
  let bestInliers = 0;

  const step = Math.max(1, Math.floor(points.length / 24));
  const sampled = points.filter((_, idx) => idx % step === 0);
  const threshold = 0.035;

  for (let i = 0; i < sampled.length; i++) {
    for (let j = i + 1; j < sampled.length; j++) {
      const dx = sampled[j].x - sampled[i].x;
      if (Math.abs(dx) < 0.04) continue;
      const m = (sampled[j].y - sampled[i].y) / dx;
      if (Math.abs(m) > maxSlope) continue;
      const c = sampled[i].y - m * sampled[i].x;

      let score = 0;
      let inliers = 0;
      for (const p of points) {
        const err = Math.abs(p.y - (m * p.x + c));
        if (err <= threshold) {
          score += p.weight * (1 - err / threshold);
          inliers++;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestM = m;
        bestC = c;
        bestInliers = inliers;
      }
    }
  }

  if (bestInliers < 3) {
    const ys = points.map((p) => p.y).sort((a, b) => a - b);
    return { m: 0, c: ys[Math.floor(ys.length / 2)], inliers: points.length };
  }

  const inlierPts = points.filter((p) => Math.abs(p.y - (bestM * p.x + bestC)) <= threshold);
  let sumW = 0;
  let sumWX = 0;
  let sumWY = 0;
  let sumWXX = 0;
  let sumWXY = 0;

  for (const p of inlierPts) {
    const w = p.weight;
    sumW += w;
    sumWX += w * p.x;
    sumWY += w * p.y;
    sumWXX += w * p.x * p.x;
    sumWXY += w * p.x * p.y;
  }

  const denom = sumW * sumWXX - sumWX * sumWX;
  if (Math.abs(denom) > 1e-8) {
    const refinedM = clamp((sumW * sumWXY - sumWX * sumWY) / denom, -maxSlope, maxSlope);
    const refinedC = (sumWY - refinedM * sumWX) / sumW;
    return { m: refinedM, c: refinedC, inliers: bestInliers };
  }

  return { m: bestM, c: bestC, inliers: bestInliers };
}

function lineFromSegment(p0: Point2D, p1: Point2D, maxSlope = 2.0): { m: number; c: number } {
  const dx = p1.x - p0.x;
  if (Math.abs(dx) < 0.01) {
    return { m: 0, c: (p0.y + p1.y) / 2 };
  }
  const m = clamp((p1.y - p0.y) / dx, -maxSlope, maxSlope);
  const c = p0.y - m * p0.x;
  return { m, c };
}

export function calculateAutoFitCorners(
  baseElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | null,
  artElement: HTMLImageElement | HTMLCanvasElement | null,
  options: {
    scaleFactor?: number;
    manualSlope?: number | null;
    verticalOffset?: number;
    guideVectors?: GuideVectors | null;
  } = {}
): [Point2D, Point2D, Point2D, Point2D] {
  const guideVectors = options.guideVectors ?? null;
  const scale = clamp(options.scaleFactor ?? (guideVectors ? 0.94 : 0.8), 0.15, 1.0);
  const verticalOffset = clamp(options.verticalOffset ?? 0, -0.5, 0.5);

  if (!baseElement || !artElement) {
    return [
      { x: 0.2, y: 0.25 },
      { x: 0.8, y: 0.25 },
      { x: 0.8, y: 0.75 },
      { x: 0.2, y: 0.75 }
    ];
  }

  const baseW =
    'videoWidth' in baseElement && baseElement.videoWidth
      ? baseElement.videoWidth
      : ('naturalWidth' in baseElement && baseElement.naturalWidth ? baseElement.naturalWidth : baseElement.width) || 800;

  const baseH =
    'videoHeight' in baseElement && baseElement.videoHeight
      ? baseElement.videoHeight
      : ('naturalHeight' in baseElement && baseElement.naturalHeight ? baseElement.naturalHeight : baseElement.height) || 600;

  const artW = ('naturalWidth' in artElement && artElement.naturalWidth ? artElement.naturalWidth : artElement.width) || 400;
  const artH = ('naturalHeight' in artElement && artElement.naturalHeight ? artElement.naturalHeight : artElement.height) || 400;

  let xLeft: number;
  let xRight: number;
  let wallTL: Point2D;
  let wallTR: Point2D;
  let wallBR: Point2D;
  let wallBL: Point2D;

  if (guideVectors) {
    const topLine = lineFromSegment(guideVectors.top[0], guideVectors.top[1]);
    const botLine = lineFromSegment(guideVectors.bot[0], guideVectors.bot[1]);
    xLeft = clamp(
      Math.min(guideVectors.top[0].x, guideVectors.top[1].x, guideVectors.bot[0].x, guideVectors.bot[1].x),
      0.02,
      0.88
    );
    xRight = clamp(
      Math.max(guideVectors.top[0].x, guideVectors.top[1].x, guideVectors.bot[0].x, guideVectors.bot[1].x),
      xLeft + 0.1,
      0.98
    );

    const topL = clamp(topLine.m * xLeft + topLine.c, 0.02, 0.88);
    const topR = clamp(topLine.m * xRight + topLine.c, 0.02, 0.88);
    const botL = clamp(botLine.m * xLeft + botLine.c, topL + 0.08, 0.98);
    const botR = clamp(botLine.m * xRight + botLine.c, topR + 0.08, 0.98);

    wallTL = { x: xLeft, y: topL };
    wallTR = { x: xRight, y: topR };
    wallBR = { x: xRight, y: botR };
    wallBL = { x: xLeft, y: botL };
  } else {
    const wall = detectWallPlane(baseElement);
    xLeft = wall.wallLeftX;
    xRight = wall.wallRightX;

    if (options.manualSlope !== null && options.manualSlope !== undefined) {
      const slope = options.manualSlope;
      const midX = (xLeft + xRight) / 2;
      const midY = (wall.wallTopY + wall.wallBotY) / 2;
      const wallH = Math.max(0.2, wall.wallBotY - wall.wallTopY);
      const halfH = wallH / 2;
      const leftDx = xLeft - midX;
      const rightDx = xRight - midX;
      const foreshortening = slope * 0.35;
      const leftHalfH = halfH * clamp(1 + foreshortening, 0.4, 1.6);
      const rightHalfH = halfH * clamp(1 - foreshortening, 0.4, 1.6);

      wallTL = { x: xLeft, y: clamp(midY + leftDx * slope - leftHalfH, 0.02, 0.92) };
      wallTR = { x: xRight, y: clamp(midY + rightDx * slope - rightHalfH, 0.02, 0.92) };
      wallBR = { x: xRight, y: clamp(midY + rightDx * slope + rightHalfH, wallTR.y + 0.1, 0.98) };
      wallBL = { x: xLeft, y: clamp(midY + leftDx * slope + leftHalfH, wallTL.y + 0.1, 0.98) };
    } else {
      const topL = clamp(wall.topLine.m * xLeft + wall.topLine.c, 0.02, 0.85);
      const topR = clamp(wall.topLine.m * xRight + wall.topLine.c, 0.02, 0.85);
      const botL = clamp(wall.botLine.m * xLeft + wall.botLine.c, topL + 0.12, 0.98);
      const botR = clamp(wall.botLine.m * xRight + wall.botLine.c, topR + 0.1, 0.98);

      wallTL = { x: xLeft, y: topL };
      wallTR = { x: xRight, y: topR };
      wallBR = { x: xRight, y: botR };
      wallBL = { x: xLeft, y: botL };
    }
  }

  const wallVisualW = Math.max(20, (xRight - xLeft) * baseW);
  const wallVisualH = Math.max(20, (((wallBL.y - wallTL.y) + (wallBR.y - wallTR.y)) / 2) * baseH);
  const wallAspect = wallVisualW / wallVisualH;
  const artAspect = artW / artH;

  let uSpan = scale;
  let vSpan = scale;
  if (artAspect > wallAspect) {
    vSpan = clamp(scale * (wallAspect / artAspect), 0.25, scale);
  } else {
    uSpan = clamp(scale * (artAspect / wallAspect), 0.25, scale);
  }

  const uCenter = 0.5;
  const vCenter = clamp(0.5 + verticalOffset * (1 - vSpan * 0.5), vSpan / 2 + 0.02, 1 - vSpan / 2 - 0.02);

  const u0 = clamp(uCenter - uSpan / 2, 0.02, 0.98);
  const u1 = clamp(uCenter + uSpan / 2, 0.02, 0.98);
  const v0 = clamp(vCenter - vSpan / 2, 0.02, 0.98);
  const v1 = clamp(vCenter + vSpan / 2, 0.02, 0.98);

  const wallQuad: [Point2D, Point2D, Point2D, Point2D] = [wallTL, wallTR, wallBR, wallBL];

  return [
    bilerpQuad(wallQuad, u0, v0),
    bilerpQuad(wallQuad, u1, v0),
    bilerpQuad(wallQuad, u1, v1),
    bilerpQuad(wallQuad, u0, v1)
  ];
}

export function applyDirectionToQuad(
  currentQuad: [Point2D, Point2D, Point2D, Point2D],
  slope: number
): [Point2D, Point2D, Point2D, Point2D] {
  const cx = (currentQuad[0].x + currentQuad[1].x + currentQuad[2].x + currentQuad[3].x) / 4;
  const cy = (currentQuad[0].y + currentQuad[1].y + currentQuad[2].y + currentQuad[3].y) / 4;

  const topW = Math.hypot(currentQuad[1].x - currentQuad[0].x, currentQuad[1].y - currentQuad[0].y);
  const botW = Math.hypot(currentQuad[2].x - currentQuad[3].x, currentQuad[2].y - currentQuad[3].y);
  const avgW = (topW + botW) / 2;

  const leftH = Math.hypot(currentQuad[3].x - currentQuad[0].x, currentQuad[3].y - currentQuad[0].y);
  const rightH = Math.hypot(currentQuad[2].x - currentQuad[1].x, currentQuad[2].y - currentQuad[1].y);
  const avgH = (leftH + rightH) / 2;

  const halfW = Math.max(0.04, Math.min(0.48, avgW / 2));
  const halfH = Math.max(0.04, Math.min(0.48, avgH / 2));

  const foreshortening = slope * 0.35;
  const leftHalfH = halfH * Math.max(0.4, Math.min(1.6, 1 + foreshortening));
  const rightHalfH = halfH * Math.max(0.4, Math.min(1.6, 1 - foreshortening));

  const leftSlopeOffset = -halfW * slope;
  const rightSlopeOffset = halfW * slope;

  const xLeft = Math.max(0.01, Math.min(0.99, cx - halfW));
  const xRight = Math.max(0.01, Math.min(0.99, cx + halfW));

  const p0: Point2D = {
    x: Number(xLeft.toFixed(4)),
    y: Number(Math.max(0.01, Math.min(0.98, cy + leftSlopeOffset - leftHalfH)).toFixed(4))
  };

  const p1: Point2D = {
    x: Number(xRight.toFixed(4)),
    y: Number(Math.max(0.01, Math.min(0.98, cy + rightSlopeOffset - rightHalfH)).toFixed(4))
  };

  const p2: Point2D = {
    x: Number(xRight.toFixed(4)),
    y: Number(Math.max(0.02, Math.min(0.99, cy + rightSlopeOffset + rightHalfH)).toFixed(4))
  };

  const p3: Point2D = {
    x: Number(xLeft.toFixed(4)),
    y: Number(Math.max(0.02, Math.min(0.99, cy + leftSlopeOffset + leftHalfH)).toFixed(4))
  };

  return [p0, p1, p2, p3];
}

export function detectWallPlane(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): WallPlane {
  const fallback: WallPlane = {
    topLine: { m: 0, c: 0.2 },
    botLine: { m: 0, c: 0.85 },
    wallLeftX: 0.12,
    wallRightX: 0.88,
    wallTopY: 0.2,
    wallBotY: 0.85,
    slope: 0,
    confidence: 0,
    direction: 'frontal',
    depthRatio: 1,
    textureRoughness: 0.65
  };

  try {
    const w = 200;
    const h = 140;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return fallback;

    ctx.drawImage(source, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    const lum = new Float32Array(w * h);
    const isNonWall = new Uint8Array(w * h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const j = y * w + x;
        const p = j * 4;
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        const l = 0.299 * r + 0.587 * g + 0.114 * b;
        lum[j] = l;

        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC > 0 ? (maxC - minC) / maxC : 0;

        const skyLike = (b - r > 16 && l > 105 && y < h * 0.65) || (l > 225 && sat < 0.2 && y < h * 0.5);
        const foliageLike = g > r * 1.06 && g > b * 1.1 && g - r > 7;

        if (skyLike || foliageLike) {
          isNonWall[j] = 1;
        }
      }
    }

    const gxMap = new Float32Array(w * h);
    const gyMap = new Float32Array(w * h);
    const magMap = new Float32Array(w * h);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const gx =
          -lum[idx - w - 1] + lum[idx - w + 1] +
          -2 * lum[idx - 1] + 2 * lum[idx + 1] +
          -lum[idx + w - 1] + lum[idx + w + 1];
        const gy =
          -lum[idx - w - 1] - 2 * lum[idx - w] - lum[idx - w + 1] +
          lum[idx + w - 1] + 2 * lum[idx + w] + lum[idx + w + 1];
        gxMap[idx] = gx;
        gyMap[idx] = gy;
        magMap[idx] = Math.hypot(gx, gy);
      }
    }

    let seedR = 0;
    let seedG = 0;
    let seedB = 0;
    let seedCount = 0;
    const sx0 = Math.floor(w * 0.22);
    const sx1 = Math.floor(w * 0.68);
    const sy0 = Math.floor(h * 0.2);
    const sy1 = Math.floor(h * 0.52);

    for (let y = sy0; y < sy1; y++) {
      for (let x = sx0; x < sx1; x++) {
        const j = y * w + x;
        if (isNonWall[j]) continue;
        const p = j * 4;
        seedR += data[p];
        seedG += data[p + 1];
        seedB += data[p + 2];
        seedCount++;
      }
    }

    if (seedCount > 0) {
      seedR /= seedCount;
      seedG /= seedCount;
      seedB /= seedCount;
    }

    const wallMask = new Uint8Array(w * h);
    const colWallCounts = new Float32Array(w);
    let wallGradSum = 0;
    let wallPixelCount = 0;

    for (let y = 3; y < h - 3; y++) {
      for (let x = 2; x < w - 2; x++) {
        const j = y * w + x;
        if (isNonWall[j]) continue;
        const p = j * 4;
        const colorDist = Math.hypot(data[p] - seedR, data[p + 1] - seedG, data[p + 2] - seedB);
        if (seedCount === 0 || colorDist < 85) {
          wallMask[j] = 1;
          colWallCounts[x]++;
          wallGradSum += magMap[j];
          wallPixelCount++;
        }
      }
    }

    const topPoints: Array<{ x: number; y: number; weight: number }> = [];
    const botPoints: Array<{ x: number; y: number; weight: number }> = [];

    for (let x = 4; x < w - 4; x += 2) {
      let colTop: number | null = null;
      for (let y = 3; y < Math.floor(h * 0.72); y++) {
        const j = y * w + x;
        if (wallMask[j] && wallMask[j + w] && wallMask[j + 2 * w]) {
          colTop = y;
          break;
        }
      }

      if (colTop === null) continue;

      const candidates: Array<{ y: number; score: number }> = [];

      for (let y = Math.min(h - 5, colTop + 14); y < h - 4; y++) {
        const j = y * w + x;
        const aboveLum = (lum[j - 3 * w] + lum[j - 2 * w] + lum[j - w]) / 3;
        const belowLum = (lum[j + w] + lum[j + 2 * w] + lum[j + 3 * w]) / 3;
        const lumContrast = Math.abs(aboveLum - belowLum);
        const pAbove = (j - 2 * w) * 4;
        const pBelow = (j + 2 * w) * 4;
        const rgbStep = Math.hypot(
          data[pAbove] - data[pBelow],
          data[pAbove + 1] - data[pBelow + 1],
          data[pAbove + 2] - data[pBelow + 2]
        );
        const verticalEdge = Math.abs(gyMap[j]);
        const wallAboveBonus = wallMask[j - 2 * w] && !wallMask[j + 2 * w] ? 18 : 0;
        const score = verticalEdge * 0.65 + lumContrast * 1.1 + rgbStep * 0.6 + wallAboveBonus;

        if (score > 22 && lumContrast > 10) {
          candidates.push({ y, score });
        }
      }

      candidates.sort((a, b) => b.score - a.score);
      const pickedBot: Array<{ y: number; score: number }> = [];
      for (const c of candidates) {
        if (pickedBot.every((p) => Math.abs(p.y - c.y) >= 8)) {
          pickedBot.push(c);
          if (pickedBot.length >= 2) break;
        }
      }

      if (pickedBot.length === 0) {
        for (let y = h - 4; y > colTop + 14; y--) {
          const j = y * w + x;
          if (wallMask[j] && wallMask[j - w] && wallMask[j - 2 * w]) {
            pickedBot.push({ y, score: 20 });
            break;
          }
        }
      }

      if (pickedBot.length > 0 && pickedBot[0].y - colTop >= 14) {
        const topEdgeW = Math.max(1, Math.abs(gyMap[colTop * w + x]));
        topPoints.push({ x: x / w, y: colTop / h, weight: topEdgeW });
        for (const b of pickedBot) {
          botPoints.push({ x: x / w, y: b.y / h, weight: b.score });
        }
      }
    }

    const topFit = fitRansacLine(topPoints, 0.2, 1.65);
    const botFit = fitRansacLine(botPoints, 0.85, 1.65);
    const topLine = { m: topFit.m, c: topFit.c };
    const botLine = { m: botFit.m, c: botFit.c };

    let peakCol = Math.floor(w * 0.4);
    let peakCount = 0;
    for (let x = Math.floor(w * 0.12); x < Math.floor(w * 0.85); x++) {
      if (colWallCounts[x] > peakCount) {
        peakCount = colWallCounts[x];
        peakCol = x;
      }
    }

    let leftCol = peakCol;
    while (leftCol > 4) {
      const nx = leftCol / w;
      const yTop = Math.max(2, Math.floor((topLine.m * nx + topLine.c) * h));
      const yBot = Math.min(h - 3, Math.floor((botLine.m * nx + botLine.c) * h));
      const spanH = (yBot - yTop) / h;
      if (spanH < 0.1 || colWallCounts[leftCol - 1] < peakCount * 0.28) break;
      let vertEdge = 0;
      let samples = 0;
      for (let y = yTop; y <= yBot; y += 2) {
        vertEdge += Math.abs(gxMap[y * w + leftCol]);
        samples++;
      }
      const avgVertEdge = samples > 0 ? vertEdge / samples : 0;
      if (peakCol - leftCol > w * 0.08 && avgVertEdge > 42) {
        break;
      }
      leftCol--;
    }

    let rightCol = peakCol;
    while (rightCol < w - 5) {
      const nx = rightCol / w;
      const spanH = botLine.m * nx + botLine.c - (topLine.m * nx + topLine.c);
      if (spanH < 0.08 || colWallCounts[rightCol + 1] < peakCount * 0.15) break;
      rightCol++;
    }

    let wallLeftX = clamp(leftCol / w, 0.05, 0.45);
    let wallRightX = clamp(rightCol / w, 0.5, 0.95);
    if (wallRightX - wallLeftX < 0.25) {
      wallLeftX = 0.14;
      wallRightX = 0.86;
    }

    const leftH = Math.max(0.08, botLine.m * wallLeftX + botLine.c - (topLine.m * wallLeftX + topLine.c));
    const rightH = Math.max(0.08, botLine.m * wallRightX + botLine.c - (topLine.m * wallRightX + topLine.c));
    const depthRatio = leftH / rightH;

    let direction: WallDirection = 'frontal';
    if (depthRatio > 1.15) direction = 'left-to-right';
    else if (depthRatio < 0.87) direction = 'right-to-left';

    const midX = (wallLeftX + wallRightX) / 2;
    const wallTopY = clamp(topLine.m * midX + topLine.c, 0.04, 0.75);
    const wallBotY = clamp(botLine.m * midX + botLine.c, wallTopY + 0.16, 0.96);
    const avgGrad = wallPixelCount > 0 ? wallGradSum / wallPixelCount : 30;
    const textureRoughness = clamp(avgGrad / 90, 0.25, 0.95);

    return {
      topLine,
      botLine,
      wallLeftX,
      wallRightX,
      wallTopY,
      wallBotY,
      slope: clamp((topLine.m + botLine.m) / 2, -0.65, 0.65),
      confidence: topFit.inliers + botFit.inliers,
      direction,
      depthRatio,
      textureRoughness
    };
  } catch {
    return fallback;
  }
}
