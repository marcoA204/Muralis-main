import { describe, it, expect } from 'vitest';
import { computeHomography, transformPoint, Point2D } from './homography.js';

describe('homography', () => {
  const src: [Point2D, Point2D, Point2D, Point2D] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 }
  ];

  it('maps identity quad accurately', () => {
    const h = computeHomography(src, src);
    const center = transformPoint(h, { x: 50, y: 50 });
    expect(center.x).toBeCloseTo(50, 4);
    expect(center.y).toBeCloseTo(50, 4);
  });

  it('maps perspective quad corners accurately', () => {
    const dst: [Point2D, Point2D, Point2D, Point2D] = [
      { x: 20, y: 10 },
      { x: 80, y: 30 },
      { x: 90, y: 90 },
      { x: 10, y: 80 }
    ];

    const h = computeHomography(src, dst);
    for (let i = 0; i < 4; i++) {
      const transformed = transformPoint(h, src[i]);
      expect(transformed.x).toBeCloseTo(dst[i].x, 4);
      expect(transformed.y).toBeCloseTo(dst[i].y, 4);
    }
  });

  it('handles negative and fractional coordinates', () => {
    const negSrc: [Point2D, Point2D, Point2D, Point2D] = [
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 }
    ];
    const dst: [Point2D, Point2D, Point2D, Point2D] = [
      { x: 0.1, y: 0.2 },
      { x: 0.9, y: 0.2 },
      { x: 0.8, y: 0.9 },
      { x: 0.2, y: 0.9 }
    ];

    const h = computeHomography(negSrc, dst);
    const center = transformPoint(h, { x: 0, y: 0 });
    expect(Number.isFinite(center.x)).toBe(true);
    expect(Number.isFinite(center.y)).toBe(true);
    expect(center.x).toBeGreaterThan(0.1);
    expect(center.x).toBeLessThan(0.9);
  });

  it('does not throw NaN explosion on degenerate collinear target points', () => {
    const collinear: [Point2D, Point2D, Point2D, Point2D] = [
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
      { x: 40, y: 40 }
    ];
    const h = computeHomography(src, collinear);
    expect(h).toHaveLength(9);
  });
});
