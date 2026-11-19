import { Point2D } from './homography.js';

export interface QuadMeasurement {
  topWidthM: number;
  bottomWidthM: number;
  leftHeightM: number;
  rightHeightM: number;
  avgWidthM: number;
  avgHeightM: number;
  areaSqM: number;
  estimatedPaintLiters: number;
}

export function computePixelDistance(
  a: Point2D,
  b: Point2D,
  width: number,
  height: number
): number {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return 0;
  }
  const dx = (b.x - a.x) * width;
  const dy = (b.y - a.y) * height;
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
    return 0;
  }
  return Math.hypot(dx, dy);
}

export function computePixelsPerMeter(
  a: Point2D,
  b: Point2D,
  realMeters: number,
  width: number,
  height: number
): number | null {
  if (!Number.isFinite(realMeters) || realMeters <= 0) {
    return null;
  }
  const pixelDistance = computePixelDistance(a, b, width, height);
  if (pixelDistance < 1e-6) {
    return null;
  }
  return pixelDistance / realMeters;
}

export function measureDistanceMeters(
  a: Point2D,
  b: Point2D,
  pixelsPerMeter: number,
  width: number,
  height: number
): number | null {
  if (!Number.isFinite(pixelsPerMeter) || pixelsPerMeter <= 0) {
    return null;
  }
  const pixelDistance = computePixelDistance(a, b, width, height);
  if (width <= 0 || height <= 0) {
    return null;
  }
  return pixelDistance / pixelsPerMeter;
}

export function measureQuadDimensions(
  corners: [Point2D, Point2D, Point2D, Point2D],
  pixelsPerMeter: number,
  width: number,
  height: number
): QuadMeasurement | null {
  if (
    !Number.isFinite(pixelsPerMeter) ||
    pixelsPerMeter <= 0 ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  const [tl, tr, br, bl] = corners;
  const topWidthM = computePixelDistance(tl, tr, width, height) / pixelsPerMeter;
  const bottomWidthM = computePixelDistance(bl, br, width, height) / pixelsPerMeter;
  const leftHeightM = computePixelDistance(tl, bl, width, height) / pixelsPerMeter;
  const rightHeightM = computePixelDistance(tr, br, width, height) / pixelsPerMeter;

  const avgWidthM = (topWidthM + bottomWidthM) / 2;
  const avgHeightM = (leftHeightM + rightHeightM) / 2;

  const meterPoints = corners.map((p) => ({
    x: (p.x * width) / pixelsPerMeter,
    y: (p.y * height) / pixelsPerMeter
  }));

  let shoelaceSum = 0;
  for (let i = 0; i < meterPoints.length; i++) {
    const curr = meterPoints[i];
    const next = meterPoints[(i + 1) % meterPoints.length];
    shoelaceSum += curr.x * next.y - next.x * curr.y;
  }
  const areaSqM = Math.abs(shoelaceSum) / 2;
  const estimatedPaintLiters = areaSqM / 10;

  return {
    topWidthM,
    bottomWidthM,
    leftHeightM,
    rightHeightM,
    avgWidthM,
    avgHeightM,
    areaSqM,
    estimatedPaintLiters
  };
}

export function formatMeters(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) {
    return '0 cm';
  }
  if (meters < 1) {
    return `${Math.round(meters * 100)} cm`;
  }
  return `${meters.toFixed(2)} m`;
}
