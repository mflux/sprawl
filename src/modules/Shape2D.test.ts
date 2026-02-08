import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';

describe('Shape2D', () => {
  const cwSquare = new Shape2D([
    new Vector2D(0, 0),
    new Vector2D(10, 0),
    new Vector2D(10, 10),
    new Vector2D(0, 10),
  ]);

  it('identifies CW winding as solid', () => {
    expect(cwSquare.isSolid()).toBe(true);
  });

  it('identifies CCW winding as hole', () => {
    const ccw = new Shape2D([
      new Vector2D(0, 0),
      new Vector2D(0, 10),
      new Vector2D(10, 10),
      new Vector2D(10, 0),
    ]);
    expect(ccw.isHole()).toBe(true);
  });

  it('detects shape-shape intersection at 2 points', () => {
    const s1 = new Shape2D([new Vector2D(5, 5), new Vector2D(15, 5), new Vector2D(15, 15), new Vector2D(5, 15)]);
    const s2 = new Shape2D([new Vector2D(10, 10), new Vector2D(20, 10), new Vector2D(20, 20), new Vector2D(10, 20)]);
    expect(s1.intersectsShape(s2)).toHaveLength(2);
  });

  it('contains an interior point', () => {
    expect(cwSquare.containsPoint(new Vector2D(5, 5))).toBe(true);
  });

  it('does not contain an exterior point', () => {
    expect(cwSquare.containsPoint(new Vector2D(15, 15))).toBe(false);
  });
});
