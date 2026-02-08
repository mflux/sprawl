import { describe, it, expect } from 'vitest';
import { ElevationMap } from './ElevationMap';
import { ShorelineDetector } from './ShorelineDetector';

describe('ShorelineDetector', () => {
  it('detects shoreline in a simple gradient', () => {
    const mockElevation = {
      getHeight: (x: number, _y: number) => Math.max(0, Math.min(1, x / 100)),
    } as ElevationMap;
    const shore = ShorelineDetector.detect(mockElevation, 0.5, 100, 100, 10, 0, 0);
    expect(shore.length).toBeGreaterThan(0);
  });

  it('segments are positioned along the threshold', () => {
    const mockElevation = {
      getHeight: (x: number, _y: number) => Math.max(0, Math.min(1, x / 100)),
    } as ElevationMap;
    const shore = ShorelineDetector.detect(mockElevation, 0.5, 100, 100, 10, 0, 0);
    const allAtMid = shore.every(s => Math.abs(s.p1.x - 50) < 1 && Math.abs(s.p2.x - 50) < 1);
    expect(allAtMid).toBe(true);
  });

  it('returns no segments in flat ocean', () => {
    const flat = { getHeight: () => 0.1 } as unknown as ElevationMap;
    expect(ShorelineDetector.detect(flat, 0.5, 100, 100, 10, 0, 0)).toHaveLength(0);
  });
});
