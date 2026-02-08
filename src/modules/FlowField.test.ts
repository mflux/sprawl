import { describe, it, expect } from 'vitest';
import { FlowField } from './FlowField';

describe('FlowField', () => {
  const field = new FlowField(100, 100, 10, -50, -50);

  it('calculates correct grid dimensions', () => {
    expect(field.cols).toBe(11);
    expect(field.rows).toBe(11);
  });

  it('returns zero vector for far out-of-bounds', () => {
    const v = field.getVectorAt(-100, -100);
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('returns valid vector for negative in-bounds coordinate', () => {
    const v = field.getVectorAt(-10, -10);
    expect(v.mag()).toBeGreaterThan(0.99);
  });

  it('interpolated vector is normalized', () => {
    const v = field.getVectorAt(15, 15);
    expect(Math.abs(v.mag() - 1)).toBeLessThan(0.001);
  });

  it('field is spatially continuous', () => {
    const v1 = field.getVectorAt(0, 0);
    const v2 = field.getVectorAt(0.1, 0.1);
    expect(v1.dist(v2)).toBeLessThan(0.1);
  });
});
