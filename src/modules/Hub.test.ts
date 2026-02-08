import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Hub } from './Hub';

describe('Hub', () => {
  const h1 = new Hub(new Vector2D(0, 0), 10);
  const h2 = new Hub(new Vector2D(15, 0), 10);
  const h3 = new Hub(new Vector2D(50, 50), 10);

  it('contains a point inside radius', () => {
    expect(h1.containsPoint(new Vector2D(5, 0))).toBe(true);
  });

  it('does not contain a point outside radius', () => {
    expect(h1.containsPoint(new Vector2D(15, 0))).toBe(false);
  });

  it('detects overlap with close hub', () => {
    expect(h1.overlaps(h2)).toBe(true);
  });

  it('does not overlap with distant hub', () => {
    expect(h1.overlaps(h3)).toBe(false);
  });
});
