import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { isBoxInView, getPathBounds, ViewBounds } from './Culling';

describe('Culling', () => {
  const bounds: ViewBounds = { minX: 0, minY: 0, maxX: 100, maxY: 100 };

  it('fully contained box is in view', () => {
    expect(isBoxInView(10, 10, 20, 20, bounds)).toBe(true);
  });

  it('partially overlapping box is in view', () => {
    expect(isBoxInView(-10, -10, 10, 10, bounds)).toBe(true);
  });

  it('full AABB correctly identifies paths crossing viewport', () => {
    const path = [new Vector2D(-100, 50), new Vector2D(50, 50), new Vector2D(-100, 60)];
    const aabb = getPathBounds(path);
    expect(isBoxInView(aabb.minX, aabb.minY, aabb.maxX, aabb.maxY, bounds)).toBe(true);
  });

  it('endpoint-only logic would incorrectly cull a path with middle in view', () => {
    const path = [new Vector2D(-100, 50), new Vector2D(50, 50), new Vector2D(-100, 60)];
    const first = path[0];
    const last = path[path.length - 1];
    // Both endpoints are at x=-100, outside bounds -- would be culled by endpoints-only check
    expect(first.x < bounds.minX && last.x < bounds.minX).toBe(true);
  });
});
