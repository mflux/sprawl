
import { Vector2D } from './Vector2D';

export interface ViewBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Basic AABB intersection test.
 */
export const isBoxInView = (minX: number, minY: number, maxX: number, maxY: number, bounds: ViewBounds) => {
  return !(maxX < bounds.minX || minX > bounds.maxX || maxY < bounds.minY || minY > bounds.maxY);
};

/**
 * Calculates the bounding box of a collection of points.
 */
export const getPathBounds = (points: Vector2D[]) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  points.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });
  return { minX, minY, maxX, maxY };
};
