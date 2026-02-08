import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { ShapeMerger } from './ShapeMerger';

describe('ShapeMerger', () => {
  const sqA = new Shape2D([new Vector2D(0, 0), new Vector2D(10, 0), new Vector2D(10, 10), new Vector2D(0, 10)]);
  const sqB = new Shape2D([new Vector2D(10, 0), new Vector2D(20, 0), new Vector2D(20, 10), new Vector2D(10, 10)]);
  const sqC = new Shape2D([new Vector2D(50, 50), new Vector2D(60, 50), new Vector2D(60, 60), new Vector2D(50, 60)]);

  it('identifies adjacent shape as neighbor', () => {
    const neighbors = ShapeMerger.findNeighbors(sqA, [sqA, sqB, sqC]);
    expect(neighbors).toHaveLength(1);
    expect(neighbors[0]).toBe(sqB);
  });

  it('identifies distant shape has no neighbors', () => {
    expect(ShapeMerger.findNeighbors(sqC, [sqA, sqB, sqC])).toHaveLength(0);
  });

  it('merges two adjacent squares into correct area', () => {
    const merged = ShapeMerger.merge(sqA, sqB);
    expect(merged).not.toBeNull();
    expect(Math.abs(Math.abs(merged!.getSignedArea()) - 200)).toBeLessThan(0.1);
  });

  it('merged shape has 4 points (rectangle)', () => {
    const merged = ShapeMerger.merge(sqA, sqB);
    expect(merged!.points).toHaveLength(4);
  });

  it('auto-merge reduces shape count', () => {
    const results = ShapeMerger.runAutoMerge([sqA, sqB, sqC], 150);
    expect(results).toHaveLength(2);
    expect(results.some(s => Math.abs(s.getSignedArea()) === 200)).toBe(true);
  });
});
