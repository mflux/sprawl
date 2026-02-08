import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';

describe('Vector2D', () => {
  it('adds components correctly', () => {
    const v1 = new Vector2D(10, 20);
    const v2 = new Vector2D(5, 5);
    const v3 = v1.add(v2);
    expect(v3.x).toBe(15);
    expect(v3.y).toBe(25);
  });

  it('calculates magnitude (Pythagorean)', () => {
    const v = new Vector2D(3, 4);
    expect(v.mag()).toBe(5);
  });

  it('normalizes to unit length', () => {
    const v = new Vector2D(10, 0).normalize();
    expect(v.mag()).toBe(1);
    expect(v.x).toBe(1);
  });

  it('computes dot product of perpendicular vectors as 0', () => {
    const v1 = new Vector2D(1, 0);
    const v2 = new Vector2D(0, 1);
    expect(v1.dot(v2)).toBe(0);
  });

  it('subtracts components correctly', () => {
    const v1 = new Vector2D(10, 20);
    const v2 = new Vector2D(5, 5);
    const v3 = v1.sub(v2);
    expect(v3.x).toBe(5);
    expect(v3.y).toBe(15);
  });
});
