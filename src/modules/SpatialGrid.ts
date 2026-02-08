
import { Vector2D } from './Vector2D';

/**
 * A simple Uniform Spatial Grid for 2D point partitioning.
 * Useful for optimizing proximity searches from O(N^2) to near O(N).
 */
export class SpatialGrid<T> {
  private grid: Map<string, T[]> = new Map();

  constructor(public cellSize: number) {}

  private getKey(p: Vector2D): string {
    const gx = Math.floor(p.x / this.cellSize);
    const gy = Math.floor(p.y / this.cellSize);
    return `${gx},${gy}`;
  }

  /**
   * Inserts an item into the grid based on its position.
   */
  insert(p: Vector2D, item: T): void {
    const key = this.getKey(p);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(item);
  }

  /**
   * Clears all items from the grid.
   */
  clear(): void {
    this.grid.clear();
  }

  /**
   * Queries the grid for items within a circular radius of a point.
   * Returns items and their associated positions for distance checking.
   */
  query(p: Vector2D, radius: number, getPos: (item: T) => Vector2D): T[] {
    const results: T[] = [];
    const rSq = radius * radius;
    
    const minGx = Math.floor((p.x - radius) / this.cellSize);
    const maxGx = Math.floor((p.x + radius) / this.cellSize);
    const minGy = Math.floor((p.y - radius) / this.cellSize);
    const maxGy = Math.floor((p.y + radius) / this.cellSize);

    for (let gx = minGx; gx <= maxGx; gx++) {
      for (let gy = minGy; gy <= maxGy; gy++) {
        const key = `${gx},${gy}`;
        const cellItems = this.grid.get(key);
        if (cellItems) {
          for (const item of cellItems) {
            const itemPos = getPos(item);
            const dx = itemPos.x - p.x;
            const dy = itemPos.y - p.y;
            if (dx * dx + dy * dy <= rSq) {
              results.push(item);
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Returns a list of keys representing occupied cells.
   */
  getOccupiedCells(): string[] {
    return Array.from(this.grid.keys());
  }
}
