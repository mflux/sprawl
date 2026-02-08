import { Vector2D } from './Vector2D';

export class Hub {
  public id: string;
  public shapePoints: Vector2D[] = [];
  public spawnTime: number = 0;
  /**
   * Tracks which indices in shapePoints have been consumed by a spawning event.
   * This ensures each vertex is used as an origin exactly once.
   */
  public usedVertexIndices: Set<number> = new Set();

  constructor(
    public position: Vector2D,
    public size: number = 20,
    public tier: number = 1
  ) {
    this.id = Math.random().toString(36).substr(2, 9);
  }

  containsPoint(p: Vector2D): boolean {
    return this.position.dist(p) <= this.size;
  }

  overlaps(other: Hub): boolean {
    return this.position.dist(other.position) < (this.size + other.size);
  }
}