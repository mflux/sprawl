
import { Vector2D } from './Vector2D';
import { Path2D } from './Path2D';

export class River {
  public path: Path2D;
  
  constructor(
    public points: Vector2D[],
    public width: number = 15,
    public depth: number = 0.3
  ) {
    this.path = new Path2D(points, false);
  }

  /**
   * Returns a depth modifier [0, 1] based on proximity to the river spine.
   * 0 = far away, 1 = exactly on the spine.
   */
  getInfluence(p: Vector2D): number {
    let minDist = Infinity;
    const segments = this.path.toSegments();
    
    for (const seg of segments) {
      const cp = seg.closestPoint(p);
      const d = p.dist(cp);
      if (d < minDist) minDist = d;
    }

    if (minDist > this.width) return 0;
    
    // Smooth cosine-based profile for the riverbed
    return Math.cos((minDist / this.width) * (Math.PI / 2));
  }
}
