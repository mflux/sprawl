import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';

export class Capsule2D {
  public segment: Segment2D;

  constructor(public p1: Vector2D, public p2: Vector2D, public radius: number) {
    this.segment = new Segment2D(p1, p2);
  }

  /**
   * Calculates the minimum distance between this capsule's core segment and another.
   */
  distanceTo(other: Capsule2D): number {
    // If the core segments intersect, distance is 0
    if (this.segment.intersect(other.segment)) return 0;

    // Otherwise, the closest distance is between an endpoint of one segment 
    // and the other segment (or endpoint to endpoint).
    const d1 = other.segment.closestPoint(this.p1).dist(this.p1);
    const d2 = other.segment.closestPoint(this.p2).dist(this.p2);
    const d3 = this.segment.closestPoint(other.p1).dist(other.p1);
    const d4 = this.segment.closestPoint(other.p2).dist(other.p2);

    return Math.min(d1, d2, d3, d4);
  }

  /**
   * Returns true if two capsules overlap.
   */
  intersects(other: Capsule2D): boolean {
    return this.distanceTo(other) <= (this.radius + other.radius);
  }
}
