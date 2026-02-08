import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';

describe('Segment2D', () => {
  it('intersects crossing segments at (5,5)', () => {
    const s1 = new Segment2D(new Vector2D(0, 0), new Vector2D(10, 10));
    const s2 = new Segment2D(new Vector2D(0, 10), new Vector2D(10, 0));
    const hit = s1.intersect(s2);
    expect(hit).not.toBeNull();
    expect(hit!.equals(new Vector2D(5, 5))).toBe(true);
  });

  it('returns null for parallel segments', () => {
    const s1 = new Segment2D(new Vector2D(0, 0), new Vector2D(0, 10));
    const s2 = new Segment2D(new Vector2D(5, 0), new Vector2D(5, 10));
    expect(s1.intersect(s2)).toBeNull();
  });

  it('detects shared vertex', () => {
    const s1 = new Segment2D(new Vector2D(0, 0), new Vector2D(10, 10));
    const s2 = new Segment2D(new Vector2D(10, 10), new Vector2D(20, 20));
    const shared = s1.sharesVertex(s2);
    expect(shared).not.toBeNull();
    expect(shared!.equals(new Vector2D(10, 10))).toBe(true);
  });

  it('detects collinear overlap', () => {
    const s1 = new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0));
    const s2 = new Segment2D(new Vector2D(5, 0), new Vector2D(15, 0));
    expect(s1.overlaps(s2)).toBe(true);
  });

  it('considers reversed segments as equal', () => {
    const s1 = new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0));
    const s2 = new Segment2D(new Vector2D(10, 0), new Vector2D(0, 0));
    expect(s1.equals(s2)).toBe(true);
  });
});
