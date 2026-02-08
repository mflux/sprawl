import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { getPathBounds } from './Culling';

/**
 * Optimized Spatial Grid for 2D Shapes.
 * Instead of storing points, it stores references to shapes in every cell 
 * their AABB overlaps. This allows O(1) or O(small constant) lookup for 
 * point-in-shape tests.
 */
export class ShapeSpatialGrid {
  private grid: Map<string, Shape2D[]> = new Map();

  constructor(public cellSize: number) {}

  /**
   * Inserts a shape into all grid cells that its bounding box overlaps.
   */
  insert(shape: Shape2D): void {
    const bounds = getPathBounds(shape.points);
    
    const minGx = Math.floor(bounds.minX / this.cellSize);
    const maxGx = Math.floor(bounds.maxX / this.cellSize);
    const minGy = Math.floor(bounds.minY / this.cellSize);
    const maxGy = Math.floor(bounds.maxY / this.cellSize);

    for (let gx = minGx; gx <= maxGx; gx++) {
      for (let gy = minGy; gy <= maxGy; gy++) {
        const key = `${gx},${gy}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        const cell = this.grid.get(key)!;
        if (!cell.includes(shape)) {
          cell.push(shape);
        }
      }
    }
  }

  /**
   * Retrieves all shapes whose AABBs overlap the cell containing the given point.
   */
  queryCandidates(p: Vector2D): Shape2D[] {
    const gx = Math.floor(p.x / this.cellSize);
    const gy = Math.floor(p.y / this.cellSize);
    const key = `${gx},${gy}`;
    return this.grid.get(key) || [];
  }

  /**
   * Performs the optimized containment check:
   * 1. Find candidates via spatial grid (cheap).
   * 2. Perform detailed point-in-polygon test only on candidates (expensive).
   */
  findShapeAt(p: Vector2D): Shape2D | null {
    const candidates = this.queryCandidates(p);
    // Iterate backwards to find the "top-most" (last added) shape if they overlap
    for (let i = candidates.length - 1; i >= 0; i--) {
      if (candidates[i].containsPoint(p)) {
        return candidates[i];
      }
    }
    return null;
  }

  clear(): void {
    this.grid.clear();
  }
}
