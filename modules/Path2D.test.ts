import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Path2D } from './Path2D';
import { Segment2D } from './Segment2D';

describe('Path2D', () => {
  it('decomposes an open path into correct number of segments', () => {
    const p = new Path2D([new Vector2D(0, 0), new Vector2D(10, 0), new Vector2D(10, 10)], false);
    expect(p.toSegments()).toHaveLength(2);
  });

  it('decomposes a closed path with a loop segment', () => {
    const p = new Path2D([new Vector2D(0, 0), new Vector2D(10, 0), new Vector2D(10, 10)], true);
    expect(p.toSegments()).toHaveLength(3);
  });

  it('detects path-segment intersection', () => {
    const p = new Path2D([new Vector2D(0, 0), new Vector2D(20, 0), new Vector2D(20, 20)], false);
    const cross = new Segment2D(new Vector2D(10, -10), new Vector2D(10, 10));
    const hits = p.intersectsSegment(cross);
    expect(hits).toHaveLength(1);
    expect(hits[0].equals(new Vector2D(10, 0))).toBe(true);
  });

  it('detects path-path intersection', () => {
    const a = new Path2D([new Vector2D(0, 0), new Vector2D(20, 20)], false);
    const b = new Path2D([new Vector2D(0, 20), new Vector2D(20, 0)], false);
    const hits = a.intersectsPath(b);
    expect(hits).toHaveLength(1);
    expect(hits[0].equals(new Vector2D(10, 10))).toBe(true);
  });
});
