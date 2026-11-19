import { describe, it, expect } from 'vitest';
import { calculateAutoFitCorners, applyDirectionToQuad } from './autoFit.js';
import { Point2D } from './homography.js';

describe('autoFit', () => {
  it('returns default centered quad when elements are null', () => {
    const quad = calculateAutoFitCorners(null, null);
    expect(quad).toHaveLength(4);
    expect(quad[0].x).toBeLessThan(quad[1].x);
    expect(quad[0].y).toBeLessThan(quad[3].y);
  });

  it('preserves quad size and applies perspective slope in applyDirectionToQuad', () => {
    const baseQuad: [Point2D, Point2D, Point2D, Point2D] = [
      { x: 0.2, y: 0.2 },
      { x: 0.8, y: 0.2 },
      { x: 0.8, y: 0.8 },
      { x: 0.2, y: 0.8 }
    ];

    const sloped = applyDirectionToQuad(baseQuad, 0.2);
    const leftHeight = sloped[3].y - sloped[0].y;
    const rightHeight = sloped[2].y - sloped[1].y;
    expect(leftHeight).toBeGreaterThan(rightHeight);

    for (const pt of sloped) {
      expect(pt.x).toBeGreaterThanOrEqual(0.01);
      expect(pt.x).toBeLessThanOrEqual(0.99);
      expect(pt.y).toBeGreaterThanOrEqual(0.01);
      expect(pt.y).toBeLessThanOrEqual(0.99);
    }
  });

  it('clamps extreme slopes without overflowing [0, 1] viewport bounds', () => {
    const nearEdgeQuad: [Point2D, Point2D, Point2D, Point2D] = [
      { x: 0.02, y: 0.02 },
      { x: 0.98, y: 0.02 },
      { x: 0.98, y: 0.98 },
      { x: 0.02, y: 0.98 }
    ];

    const sloped = applyDirectionToQuad(nearEdgeQuad, -0.5);
    for (const pt of sloped) {
      expect(pt.x).toBeGreaterThanOrEqual(0.01);
      expect(pt.x).toBeLessThanOrEqual(0.99);
      expect(pt.y).toBeGreaterThanOrEqual(0.01);
      expect(pt.y).toBeLessThanOrEqual(0.99);
    }
  });

  it('fits artwork proportionally along perspective guide vectors', () => {
    const mockBase = { width: 1000, height: 600 } as HTMLCanvasElement;
    const mockArt = { width: 500, height: 500 } as HTMLCanvasElement;

    const quad = calculateAutoFitCorners(mockBase, mockArt, {
      guideVectors: {
        top: [
          { x: 0.21, y: 0.08 },
          { x: 0.55, y: 0.26 }
        ],
        bot: [
          { x: 0.21, y: 0.94 },
          { x: 0.55, y: 0.68 }
        ]
      }
    });

    expect(quad[0].x).toBeGreaterThanOrEqual(0.2);
    expect(quad[1].x).toBeLessThanOrEqual(0.56);
    expect(quad[0].y).toBeLessThan(quad[1].y);
    expect(quad[3].y).toBeGreaterThan(quad[2].y);
    expect(quad[3].y - quad[0].y).toBeGreaterThan(quad[2].y - quad[1].y);
  });
});
