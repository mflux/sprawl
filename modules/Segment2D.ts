
import { Vector2D } from './Vector2D';

export class Segment2D {
  public isBridge: boolean = false;

  constructor(public p1: Vector2D, public p2: Vector2D) {}

  length(): number {
    return this.p1.dist(this.p2);
  }

  midpoint(): Vector2D {
    return this.p1.add(this.p2).div(2);
  }

  equals(other: Segment2D): boolean {
    return (this.p1.equals(other.p1) && this.p2.equals(other.p2)) ||
           (this.p1.equals(other.p2) && this.p2.equals(other.p1));
  }

  sharesVertex(other: Segment2D): Vector2D | null {
    if (this.p1.equals(other.p1) || this.p1.equals(other.p2)) return this.p1;
    if (this.p2.equals(other.p1) || this.p2.equals(other.p2)) return this.p2;
    return null;
  }

  containsPoint(p: Vector2D, epsilon: number = 0.001): boolean {
    const d1 = p.dist(this.p1);
    const d2 = p.dist(this.p2);
    const len = this.length();
    // Point is on line segment if distance to both ends equals total length
    return Math.abs(d1 + d2 - len) < epsilon;
  }

  closestPoint(p: Vector2D): Vector2D {
    const v = this.p2.sub(this.p1);
    const w = p.sub(this.p1);
    const vMagSq = v.x * v.x + v.y * v.y;
    if (vMagSq === 0) return this.p1.copy();
    
    let t = w.dot(v) / vMagSq;
    t = Math.max(0, Math.min(1, t));
    
    return this.p1.add(v.mul(t));
  }

  overlaps(other: Segment2D): boolean {
    if (this.equals(other)) return true;
    
    // Check collinearity via cross product
    const v1 = this.p2.sub(this.p1);
    const v2 = other.p2.sub(other.p1);
    const cross = v1.x * v2.y - v1.y * v2.x;
    
    // If not parallel, can't overlap collinearly
    if (Math.abs(cross) > 0.001) return false;

    // Check if points are collinear
    const v3 = other.p1.sub(this.p1);
    const cross2 = v1.x * v3.y - v1.y * v3.x;
    if (Math.abs(cross2) > 0.001) return false;

    // Collinear segments overlap if one endpoint of one segment lies on the other,
    // and it's not JUST a shared vertex.
    const p1On = this.containsPoint(other.p1);
    const p2On = this.containsPoint(other.p2);
    const op1On = other.containsPoint(this.p1);
    const op2On = other.containsPoint(this.p2);

    // To be an "overlap" (more than just sharing an endpoint), 
    // at least one point must be strictly inside the other segment 
    // or multiple points must be on.
    const shared = this.sharesVertex(other);
    if (shared) {
      // If they share a vertex, check if any OTHER point is contained
      if (this.p1.equals(shared)) return this.containsPoint(other.p1) && !other.p1.equals(shared) || this.containsPoint(other.p2) && !other.p2.equals(shared);
      if (this.p2.equals(shared)) return this.containsPoint(other.p1) && !other.p1.equals(shared) || this.containsPoint(other.p2) && !other.p2.equals(shared);
    }

    return p1On || p2On || op1On || op2On;
  }

  intersect(other: Segment2D): Vector2D | null {
    const x1 = this.p1.x, y1 = this.p1.y;
    const x2 = this.p2.x, y2 = this.p2.y;
    const x3 = other.p1.x, y3 = other.p1.y;
    const x4 = other.p2.x, y4 = other.p2.y;

    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return null; // Parallel or Collinear

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return new Vector2D(
        x1 + ua * (x2 - x1),
        y1 + ua * (y2 - y1)
      );
    }

    return null;
  }
}
