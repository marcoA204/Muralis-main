import { describe, it, expect } from 'vitest';
import {
  computePixelDistance,
  computePixelsPerMeter,
  measureDistanceMeters,
  measureQuadDimensions,
  formatMeters
} from './wallMeasurement.js';

describe('wallMeasurement', () => {
  it('computes Euclidean pixel distance with aspect ratio', () => {
    const dist = computePixelDistance(
      { x: 0, y: 0 },
      { x: 0.5, y: 0.5 },
      800,
      600
    );
    expect(dist).toBeCloseTo(500, 4);
  });

  it('returns 0 for invalid or zero canvas dimensions', () => {
    expect(computePixelDistance({ x: 0, y: 0 }, { x: 1, y: 1 }, 0, 600)).toBe(0);
    expect(computePixelDistance({ x: 0, y: 0 }, { x: 1, y: 1 }, 800, -10)).toBe(0);
    expect(computePixelDistance({ x: 0, y: 0 }, { x: 1, y: 1 }, Number.NaN, 600)).toBe(0);
  });

  it('calibrates pixels per meter and measures distances accurately', () => {
    const p1 = { x: 0.25, y: 0.5 };
    const p2 = { x: 0.75, y: 0.5 };
    const ppm = computePixelsPerMeter(p1, p2, 2.0, 800, 600);
    expect(ppm).toBeCloseTo(200, 4);

    const verticalDist = measureDistanceMeters(
      { x: 0.5, y: 0 },
      { x: 0.5, y: 0.5 },
      ppm!,
      800,
      600
    );
    expect(verticalDist).toBeCloseTo(1.5, 4);
  });

  it('rejects degenerate calibration inputs', () => {
    expect(computePixelsPerMeter({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 }, 2, 800, 600)).toBeNull();
    expect(computePixelsPerMeter({ x: 0.1, y: 0.5 }, { x: 0.9, y: 0.5 }, 0, 800, 600)).toBeNull();
    expect(computePixelsPerMeter({ x: 0.1, y: 0.5 }, { x: 0.9, y: 0.5 }, -3, 800, 600)).toBeNull();
    expect(computePixelsPerMeter({ x: 0.1, y: 0.5 }, { x: 0.9, y: 0.5 }, Number.NaN, 800, 600)).toBeNull();
  });

  it('measures rectangular and trapezoidal mural dimensions and paint estimate', () => {
    const ppm = 100;
    const rect = measureQuadDimensions(
      [
        { x: 0, y: 0 },
        { x: 0.5, y: 0 },
        { x: 0.5, y: 0.5 },
        { x: 0, y: 0.5 }
      ],
      ppm,
      800,
      600
    );

    expect(rect).not.toBeNull();
    expect(rect!.avgWidthM).toBeCloseTo(4.0, 4);
    expect(rect!.avgHeightM).toBeCloseTo(3.0, 4);
    expect(rect!.areaSqM).toBeCloseTo(12.0, 4);
    expect(rect!.estimatedPaintLiters).toBeCloseTo(1.2, 4);
  });

  it('formats meters and centimeters cleanly', () => {
    expect(formatMeters(0.85)).toBe('85 cm');
    expect(formatMeters(1.0)).toBe('1.00 m');
    expect(formatMeters(3.456)).toBe('3.46 m');
    expect(formatMeters(-1)).toBe('0 cm');
    expect(formatMeters(Number.NaN)).toBe('0 cm');
  });
});
