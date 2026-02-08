import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { River } from './River';
import { RiverGenerator } from './RiverGenerator';
import { ElevationMap } from './ElevationMap';

describe('River', () => {
  it('river generator creates a path that flows downhill', () => {
    const mockElevation = {
      getHeight: (x: number, _y: number) => 1.0 - x / 500,
    } as ElevationMap;
    const start = new Vector2D(50, 50);
    const river = RiverGenerator.generate(mockElevation, 0.3, start, 10, 50);
    expect(river).not.toBeNull();
    expect(river!.points.length).toBeGreaterThan(0);
    const end = river!.points[river!.points.length - 1];
    expect(end.x).toBeGreaterThan(start.x);
  });

  it('influence is 1.0 on the spine', () => {
    const r = new River([new Vector2D(0, 0), new Vector2D(100, 0)], 20);
    expect(Math.abs(r.getInfluence(new Vector2D(50, 0)) - 1.0)).toBeLessThan(0.01);
  });

  it('influence is 0.0 outside width', () => {
    const r = new River([new Vector2D(0, 0), new Vector2D(100, 0)], 20);
    expect(r.getInfluence(new Vector2D(50, 30))).toBe(0);
  });

  it('influence is partial at mid-width', () => {
    const r = new River([new Vector2D(0, 0), new Vector2D(100, 0)], 20);
    const inf = r.getInfluence(new Vector2D(50, 10));
    expect(inf).toBeGreaterThan(0);
    expect(inf).toBeLessThan(1.0);
  });
});
