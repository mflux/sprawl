import { describe, it, expect } from 'vitest';
import { ElevationMap } from './ElevationMap';

describe('ElevationMap', () => {
  const map = new ElevationMap(12345);

  it('elevation values are normalized between 0 and 1', () => {
    const heights = Array.from({ length: 100 }, () => map.getHeight(Math.random() * 1000, Math.random() * 1000));
    expect(heights.every(h => h >= 0 && h <= 1)).toBe(true);
  });

  it('elevation is spatially continuous', () => {
    const h1 = map.getHeight(100, 100);
    const h2 = map.getHeight(100.1, 100.1);
    expect(Math.abs(h1 - h2)).toBeLessThan(0.05);
  });

  it('height is deterministic for same seed and coords', () => {
    expect(map.getHeight(500, 500)).toBe(map.getHeight(500, 500));
  });

  it('categorizes low heights as water', () => {
    expect(map.getCategory(0.1, 0.3)).toBe('water');
  });

  it('categorizes high heights as snow', () => {
    expect(map.getCategory(0.95, 0.3)).toBe('snow');
  });
});
