import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { Subdivider } from './Subdivider';

describe('Subdivider', () => {
  it('computes inward normal on square corner', () => {
    const square = new Shape2D([
      new Vector2D(0, 0), new Vector2D(100, 0), new Vector2D(100, 100), new Vector2D(0, 100),
    ]);
    const normal = square.getInwardNormal(0);
    expect(normal.x).toBeGreaterThan(0.5);
    expect(normal.y).toBeGreaterThan(0.5);
  });

  it('spawns subdividers from oblong shape', () => {
    const oblong = new Shape2D([
      new Vector2D(0, 0), new Vector2D(500, 0), new Vector2D(500, 100), new Vector2D(0, 100),
    ]);
    const ants = Subdivider.spawnSubdividers(oblong, 5, 0);
    expect(ants.length).toBeGreaterThan(0);
  });

  it('subdividers share a guide direction', () => {
    const oblong = new Shape2D([
      new Vector2D(0, 0), new Vector2D(500, 0), new Vector2D(500, 100), new Vector2D(0, 100),
    ]);
    const ants = Subdivider.spawnSubdividers(oblong, 5, 0);
    if (ants.length > 1) {
      expect(ants[0].direction.equals(ants[1].direction)).toBe(true);
    }
  });

  it('rejects shapes below area threshold', () => {
    const small = new Shape2D([
      new Vector2D(0, 0), new Vector2D(10, 0), new Vector2D(10, 10), new Vector2D(0, 10),
    ]);
    expect(Subdivider.spawnSubdividers(small, 5, 0)).toHaveLength(0);
  });
});
