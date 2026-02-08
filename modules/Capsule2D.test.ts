import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Capsule2D } from './Capsule2D';

describe('Capsule2D', () => {
  it('parallel capsules within radius sum intersect', () => {
    const c1 = new Capsule2D(new Vector2D(0, 0), new Vector2D(0, 10), 2);
    const c2 = new Capsule2D(new Vector2D(3, 0), new Vector2D(3, 10), 2);
    expect(c1.intersects(c2)).toBe(true);
  });

  it('distant parallel capsules do not intersect', () => {
    const c1 = new Capsule2D(new Vector2D(0, 0), new Vector2D(0, 10), 2);
    const c2 = new Capsule2D(new Vector2D(10, 0), new Vector2D(10, 10), 2);
    expect(c1.intersects(c2)).toBe(false);
  });

  it('crossing segments (T-bone) intersect', () => {
    const c1 = new Capsule2D(new Vector2D(0, 0), new Vector2D(0, 10), 2);
    const c2 = new Capsule2D(new Vector2D(-5, 5), new Vector2D(5, 5), 1);
    expect(c1.intersects(c2)).toBe(true);
  });

  it('capsules touching end-to-end within radius intersect', () => {
    const c1 = new Capsule2D(new Vector2D(0, 0), new Vector2D(0, 10), 2);
    const c2 = new Capsule2D(new Vector2D(0, 13), new Vector2D(0, 20), 2);
    expect(c1.intersects(c2)).toBe(true);
  });
});
