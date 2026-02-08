
import { Vector2D } from './Vector2D';
import { Path2D } from './Path2D';
import { Segment2D } from './Segment2D';

export class Shape2D {
  public path: Path2D;
  public guideVector: Vector2D | null = null;

  constructor(points: Vector2D[]) {
    // A shape is always a closed path
    this.path = new Path2D(points, true);
  }

  get points(): Vector2D[] {
    return this.path.points;
  }

  /**
   * Calculates the signed area of the polygon using the Shoelace formula.
   * In Screen coordinates (Y-down):
   * Positive area = Clockwise (Solid per user requirements)
   * Negative area = Counter-Clockwise (Hole per user requirements)
   */
  getSignedArea(): number {
    let area = 0;
    const pts = this.points;
    if (pts.length < 3) return 0;
    
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      area += (p1.x * p2.y - p2.x * p1.y);
    }
    return area / 2;
  }

  /**
   * CCW is Hole (negative signed area in Y-down screen space)
   */
  isHole(): boolean {
    return this.getSignedArea() < -0.000001;
  }

  /**
   * CW is Solid (positive signed area in Y-down screen space)
   */
  isSolid(): boolean {
    return this.getSignedArea() > 0.000001;
  }

  toSegments(): Segment2D[] {
    return this.path.toSegments();
  }

  intersectsShape(other: Shape2D): Vector2D[] {
    return this.path.intersectsPath(other.path);
  }

  /**
   * Basic point-in-polygon test (Ray casting)
   */
  containsPoint(p: Vector2D): boolean {
    let inside = false;
    const pts = this.points;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      if (((pts[i].y > p.y) !== (pts[j].y > p.y)) &&
          (p.x < (pts[j].x - pts[i].x) * (p.y - pts[i].y) / (pts[j].y - pts[i].y) + pts[i].x)) {
        inside = !inside;
      }
    }
    return inside;
  }

  /**
   * Returns a simplified version of the shape with redundant collinear points removed.
   */
  simplify(epsilon: number = 0.001): Shape2D {
    const pts = this.points;
    if (pts.length <= 3) return this;
    
    const result: Vector2D[] = [];
    for (let i = 0; i < pts.length; i++) {
      const prev = pts[(i - 1 + pts.length) % pts.length];
      const curr = pts[i];
      const next = pts[(i + 1) % pts.length];

      const v1 = curr.sub(prev).normalize();
      const v2 = next.sub(curr).normalize();
      
      // If dot product is near 1, they are collinear and curr is redundant
      if (Math.abs(v1.dot(v2) - 1) > epsilon) {
        result.push(curr);
      }
    }
    return new Shape2D(result);
  }

  /**
   * Returns a normalized vector pointing inwards from the vertex at the given index.
   */
  getInwardNormal(vertexIndex: number): Vector2D {
    const pts = this.points;
    const i = vertexIndex;
    const prev = pts[(i - 1 + pts.length) % pts.length];
    const curr = pts[i];
    const next = pts[(i + 1) % pts.length];

    const v1 = curr.sub(prev).normalize();
    const v2 = next.sub(curr).normalize();

    // Normal of edge (prev -> curr) pointing "right" in CW winding is inward
    // Normal of (dx, dy) rotated 90 deg CW in Y-down is (-dy, dx)
    const n1 = new Vector2D(-v1.y, v1.x);
    const n2 = new Vector2D(-v2.y, v2.x);

    const bisector = n1.add(n2).normalize();
    
    // Safety check: if bisector points outward for some reason (complex shape), flip it.
    // In CW winding, the right-hand normal is generally inward.
    const testPoint = curr.add(bisector.mul(2));
    if (!this.containsPoint(testPoint)) {
      return bisector.mul(-1);
    }

    return bisector;
  }
}
