import { Point2D, computeHomography, transformPoint } from './homography.js';

export interface WarpOptions {
  subdivisions?: number;
}

export function drawWarpedImage(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  image: HTMLImageElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas,
  dstCorners: [Point2D, Point2D, Point2D, Point2D],
  options: WarpOptions = {}
): void {
  const subdivisions = options.subdivisions || 16;
  const imgWidth = image.width;
  const imgHeight = image.height;

  const srcCorners: [Point2D, Point2D, Point2D, Point2D] = [
    { x: 0, y: 0 },
    { x: imgWidth, y: 0 },
    { x: imgWidth, y: imgHeight },
    { x: 0, y: imgHeight }
  ];

  const homography = computeHomography(srcCorners, dstCorners);

  const stepX = imgWidth / subdivisions;
  const stepY = imgHeight / subdivisions;

  const grid: Point2D[][] = [];
  for (let row = 0; row <= subdivisions; row++) {
    grid[row] = [];
    const sy = row * stepY;
    for (let col = 0; col <= subdivisions; col++) {
      const sx = col * stepX;
      grid[row][col] = transformPoint(homography, { x: sx, y: sy });
    }
  }

  for (let row = 0; row < subdivisions; row++) {
    for (let col = 0; col < subdivisions; col++) {
      const u0 = col * stepX;
      const v0 = row * stepY;
      const u1 = (col + 1) * stepX;
      const v1 = (row + 1) * stepY;

      const p00 = grid[row][col];
      const p10 = grid[row][col + 1];
      const p11 = grid[row + 1][col + 1];
      const p01 = grid[row + 1][col];

      renderTriangleAffine(
        ctx,
        image,
        { x: u0, y: v0 },
        { x: u1, y: v0 },
        { x: u0, y: v1 },
        p00,
        p10,
        p01
      );

      renderTriangleAffine(
        ctx,
        image,
        { x: u1, y: v0 },
        { x: u1, y: v1 },
        { x: u0, y: v1 },
        p10,
        p11,
        p01
      );
    }
  }
}

function renderTriangleAffine(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  image: HTMLImageElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas,
  s0: Point2D,
  s1: Point2D,
  s2: Point2D,
  d0: Point2D,
  d1: Point2D,
  d2: Point2D
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(d0.x, d0.y);
  ctx.lineTo(d1.x, d1.y);
  ctx.lineTo(d2.x, d2.y);
  ctx.closePath();
  ctx.clip();

  const delta = s0.x * (s1.y - s2.y) - s1.x * (s0.y - s2.y) + s2.x * (s0.y - s1.y);
  if (Math.abs(delta) < 1e-10) {
    ctx.restore();
    return;
  }

  const a = (d0.x * (s1.y - s2.y) - d1.x * (s0.y - s2.y) + d2.x * (s0.y - s1.y)) / delta;
  const b = (d0.y * (s1.y - s2.y) - d1.y * (s0.y - s2.y) + d2.y * (s0.y - s1.y)) / delta;
  const c = (s0.x * (d1.x - d2.x) - s1.x * (d0.x - d2.x) + s2.x * (d0.x - d1.x)) / delta;
  const d = (s0.x * (d1.y - d2.y) - s1.x * (d0.y - d2.y) + s2.x * (d0.y - d1.y)) / delta;
  const e = (s0.x * (s1.y * d2.x - s2.y * d1.x) - s1.x * (s0.y * d2.x - s2.y * d0.x) + s2.x * (s0.y * d1.x - s1.y * d0.x)) / delta;
  const f = (s0.x * (s1.y * d2.y - s2.y * d1.y) - s1.x * (s0.y * d2.y - s2.y * d0.y) + s2.x * (s0.y * d1.y - s1.y * d0.y)) / delta;

  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}
