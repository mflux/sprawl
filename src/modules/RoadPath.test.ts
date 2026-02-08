import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { RoadPath } from './RoadPath';

describe('RoadPath', () => {
  it('detects single continuous stretch', () => {
    const segs = [
      new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0)),
      new Segment2D(new Vector2D(10, 0), new Vector2D(20, 0)),
      new Segment2D(new Vector2D(20, 0), new Vector2D(30, 0)),
    ];
    const stretches = RoadPath.detectStretches(segs);
    expect(stretches).toHaveLength(1);
    expect(stretches[0].points).toHaveLength(4);
    expect(stretches[0].length()).toBe(30);
  });

  it('detects 3 stretches from fork', () => {
    const segs = [
      new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0)),
      new Segment2D(new Vector2D(10, 0), new Vector2D(20, 0)),
      new Segment2D(new Vector2D(20, 0), new Vector2D(30, 0)),
      new Segment2D(new Vector2D(10, 0), new Vector2D(10, 10)),
    ];
    expect(RoadPath.detectStretches(segs)).toHaveLength(3);
  });

  it('calculates midpoint correctly', () => {
    const path = new RoadPath([new Vector2D(0, 0), new Vector2D(100, 0)]);
    expect(path.midpoint().equals(new Vector2D(50, 0))).toBe(true);
  });
});
