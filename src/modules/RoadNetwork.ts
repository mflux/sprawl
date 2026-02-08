
import { Segment2D } from './Segment2D';
import { Vector2D } from './Vector2D';
import { SpatialGrid } from './SpatialGrid';

export class RoadNetwork {
  /**
   * Finds the nearest vertex in the collection of segments.
   */
  static findNearestVertex(p: Vector2D, segments: Segment2D[], threshold: number, grid?: SpatialGrid<Vector2D>): Vector2D | null {
    if (grid) {
      const neighbors = grid.query(p, threshold, v => v);
      if (neighbors.length === 0) return null;
      
      let nearest: Vector2D = neighbors[0];
      let minDist = p.dist(nearest);
      
      for (let i = 1; i < neighbors.length; i++) {
        const d = p.dist(neighbors[i]);
        if (d < minDist) {
          minDist = d;
          nearest = neighbors[i];
        }
      }
      return nearest;
    }

    let nearest: Vector2D | null = null;
    let minDist = threshold;

    for (const seg of segments) {
      const d1 = p.dist(seg.p1);
      if (d1 < minDist) {
        minDist = d1;
        nearest = seg.p1;
      }
      const d2 = p.dist(seg.p2);
      if (d2 < minDist) {
        minDist = d2;
        nearest = seg.p2;
      }
    }
    return nearest;
  }

  /**
   * Tries to add a segment to the network with snapping.
   */
  static addSegmentSnapped(p1: Vector2D, p2: Vector2D, segments: Segment2D[], threshold: number = 8, grid?: SpatialGrid<Vector2D>): Segment2D | null {
    const snappedP1 = this.findNearestVertex(p1, segments, threshold, grid) || p1;
    let snappedP2 = this.findNearestVertex(p2, segments, threshold, grid);

    if (!snappedP2 && p2.dist(snappedP1) < threshold) {
      snappedP2 = snappedP1;
    }

    snappedP2 = snappedP2 || p2;

    if (snappedP1.equals(snappedP2)) return null;

    const newSeg = new Segment2D(snappedP1.copy(), snappedP2.copy());

    // Check if segment already exists
    const existing = segments.find(s => s.equals(newSeg));
    if (existing) {
      return existing; // Return existing so caller can modify flags
    }

    segments.push(newSeg);
    if (grid) {
      grid.insert(newSeg.p1, newSeg.p1);
      grid.insert(newSeg.p2, newSeg.p2);
    }
    return newSeg;
  }

  /**
   * Efficiently splits intersecting segments.
   * Preserves metadata like 'isBridge' for sub-segments.
   */
  static splitIntersections(segments: Segment2D[]): Segment2D[] {
    if (segments.length < 2) return segments;
    
    let result = [...segments];
    const EPS = 0.1;
    const MAX_TOTAL_SPLITS = 2000;
    let totalSplits = 0;
    
    let changed = true;
    let iterations = 0;
    const MAX_ITER = 5;

    while (changed && iterations < MAX_ITER) {
      changed = false;
      iterations++;
      
      const nextBatch: Segment2D[] = [];
      const splitTracker = new Set<number>();
      
      const cellSize = 80;
      const grid = new SpatialGrid<number>(cellSize);
      result.forEach((seg, idx) => grid.insert(seg.midpoint(), idx));

      for (let i = 0; i < result.length; i++) {
        if (splitTracker.has(i)) continue;
        
        const s1 = result[i];
        const s1Len = s1.length();
        const searchRadius = s1Len / 2 + cellSize;
        const candidates = grid.query(s1.midpoint(), searchRadius, idx => result[idx].midpoint());

        let splitFound = false;
        for (const j of candidates) {
          if (i === j || splitTracker.has(j)) continue;
          
          const s2 = result[j];
          const hit = s1.intersect(s2);

          if (hit) {
            const s1Interior = hit.dist(s1.p1) > EPS && hit.dist(s1.p2) > EPS;
            const s2Interior = hit.dist(s2.p1) > EPS && hit.dist(s2.p2) > EPS;

            if (s1Interior || s2Interior) {
              splitTracker.add(i);
              splitTracker.add(j);
              
              if (s1Interior) {
                const sub1 = new Segment2D(s1.p1, hit);
                const sub2 = new Segment2D(hit, s1.p2);
                sub1.isBridge = s1.isBridge;
                sub2.isBridge = s1.isBridge;
                nextBatch.push(sub1, sub2);
              } else {
                nextBatch.push(s1);
              }

              if (s2Interior) {
                const subA = new Segment2D(s2.p1, hit);
                const subB = new Segment2D(hit, s2.p2);
                subA.isBridge = s2.isBridge;
                subB.isBridge = s2.isBridge;
                nextBatch.push(subA, subB);
              } else {
                nextBatch.push(s2);
              }
              
              splitFound = true;
              changed = true;
              totalSplits++;
              break; 
            }
          }
        }

        if (!splitFound) {
          nextBatch.push(s1);
        }

        if (totalSplits > MAX_TOTAL_SPLITS) {
          changed = false;
          break;
        }
      }
      
      result = nextBatch;
    }

    return result;
  }

  /**
   * Performs a global cleanup pass.
   * Transports the 'isBridge' status to representative segments.
   */
  static cleanupNetwork(segments: Segment2D[], threshold: number = 8): Segment2D[] {
    if (segments.length === 0) return [];

    const grid = new SpatialGrid<Vector2D>(threshold * 2);
    
    const getRepresentative = (v: Vector2D): Vector2D => {
      const neighbors = grid.query(v, threshold, p => p);
      if (neighbors.length > 0) {
        let closest = neighbors[0];
        let minDist = v.dist(closest);
        for (let i = 1; i < neighbors.length; i++) {
          const d = v.dist(neighbors[i]);
          if (d < minDist) {
            minDist = d;
            closest = neighbors[i];
          }
        }
        return closest;
      }
      grid.insert(v, v);
      return v;
    };

    let cleaned: Segment2D[] = [];
    const segmentMap = new Map<string, Segment2D>();

    segments.forEach(seg => {
      const p1 = getRepresentative(seg.p1);
      const p2 = getRepresentative(seg.p2);
      
      if (!p1.equals(p2)) {
        const k1 = `${p1.x.toFixed(2)},${p1.y.toFixed(2)}`;
        const k2 = `${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
        const key = k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
        
        if (!segmentMap.has(key)) {
          const newSeg = new Segment2D(p1, p2);
          newSeg.isBridge = seg.isBridge; // CRITICAL FIX: Transfer flag
          segmentMap.set(key, newSeg);
          cleaned.push(newSeg);
        } else {
          // If multiple segments map to one, the representative is a bridge if ANY source was
          if (seg.isBridge) {
            segmentMap.get(key)!.isBridge = true;
          }
        }
      }
    });

    cleaned = this.splitIntersections(cleaned);

    return cleaned;
  }
}
