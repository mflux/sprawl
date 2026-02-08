
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';

export class Path2D {
  constructor(public points: Vector2D[] = [], public closed: boolean = false) {}

  toSegments(): Segment2D[] {
    const segments: Segment2D[] = [];
    if (this.points.length < 2) return segments;

    for (let i = 0; i < this.points.length - 1; i++) {
      segments.push(new Segment2D(this.points[i], this.points[i + 1]));
    }

    if (this.closed && this.points.length > 2) {
      segments.push(new Segment2D(this.points[this.points.length - 1], this.points[0]));
    }

    return segments;
  }

  intersectsSegment(segment: Segment2D): Vector2D[] {
    const intersections: Vector2D[] = [];
    const segments = this.toSegments();
    
    for (const s of segments) {
      const hit = s.intersect(segment);
      if (hit) {
        // Avoid duplicate points at vertices
        if (!intersections.some(p => p.equals(hit))) {
          intersections.push(hit);
        }
      }
    }
    return intersections;
  }

  intersectsPath(other: Path2D): Vector2D[] {
    const intersections: Vector2D[] = [];
    const segmentsA = this.toSegments();
    const segmentsB = other.toSegments();

    for (const sa of segmentsA) {
      for (const sb of segmentsB) {
        const hit = sa.intersect(sb);
        if (hit) {
          if (!intersections.some(p => p.equals(hit))) {
            intersections.push(hit);
          }
        }
      }
    }
    return intersections;
  }
}
