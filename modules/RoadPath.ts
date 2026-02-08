
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';

/**
 * A RoadPath is a sequence of connected points where interior points 
 * have a degree of exactly 2 (no forks).
 */
export class RoadPath {
  constructor(public points: Vector2D[]) {}

  length(): number {
    let len = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      len += this.points[i].dist(this.points[i + 1]);
    }
    return len;
  }

  midpoint(): Vector2D {
    if (this.points.length < 2) return new Vector2D(0, 0);
    
    const targetLen = this.length() / 2;
    let accumulated = 0;
    
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      const d = p1.dist(p2);
      
      if (accumulated + d >= targetLen) {
        const remaining = targetLen - accumulated;
        const dir = p2.sub(p1).normalize();
        return p1.add(dir.mul(remaining));
      }
      accumulated += d;
    }
    return this.points[this.points.length - 1].copy();
  }

  /**
   * Returns a list of all non-forking stretches in the given segments.
   */
  static detectStretches(segments: Segment2D[]): RoadPath[] {
    const adj = new Map<string, Vector2D[]>();
    const key = (v: Vector2D) => `${v.x.toFixed(2)},${v.y.toFixed(2)}`;
    
    // 1. Build Adjacency Graph
    segments.forEach(s => {
      const k1 = key(s.p1);
      const k2 = key(s.p2);
      if (!adj.has(k1)) adj.set(k1, []);
      if (!adj.has(k2)) adj.set(k2, []);
      adj.get(k1)!.push(s.p2);
      adj.get(k2)!.push(s.p1);
    });

    const visitedEdges = new Set<string>();
    const edgeKey = (v1: Vector2D, v2: Vector2D) => {
      const k1 = key(v1);
      const k2 = key(v2);
      return k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
    };

    const stretches: RoadPath[] = [];

    // 2. Identify "Nodes" (degree 1 or > 2)
    const nodes: Vector2D[] = [];
    for (const [k, neighbors] of adj.entries()) {
      if (neighbors.length !== 2) {
        const [x, y] = k.split(',').map(Number);
        nodes.push(new Vector2D(x, y));
      }
    }

    // 3. Trace from each node
    nodes.forEach(startNode => {
      const neighbors = adj.get(key(startNode)) || [];
      neighbors.forEach(neighbor => {
        if (visitedEdges.has(edgeKey(startNode, neighbor))) return;

        // Start a new stretch
        const pts: Vector2D[] = [startNode, neighbor];
        visitedEdges.add(edgeKey(startNode, neighbor));
        
        let prev = startNode;
        let curr = neighbor;

        // Keep going as long as the current point has exactly degree 2
        while (adj.get(key(curr))?.length === 2) {
          const next = adj.get(key(curr))!.find(n => !n.equals(prev));
          if (!next || visitedEdges.has(edgeKey(curr, next))) break;
          
          pts.push(next);
          visitedEdges.add(edgeKey(curr, next));
          prev = curr;
          curr = next;
        }

        if (pts.length >= 2) {
          stretches.push(new RoadPath(pts));
        }
      });
    });

    // Special case: Isolated cycles (no nodes of degree 1 or > 2)
    for (const s of segments) {
      if (!visitedEdges.has(edgeKey(s.p1, s.p2))) {
        // This is part of a cycle with only degree-2 vertices
        const pts: Vector2D[] = [s.p1, s.p2];
        visitedEdges.add(edgeKey(s.p1, s.p2));
        
        let prev = s.p1;
        let curr = s.p2;
        
        while (adj.get(key(curr))?.length === 2) {
          const next = adj.get(key(curr))!.find(n => !n.equals(prev));
          if (!next || visitedEdges.has(edgeKey(curr, next))) break;
          
          pts.push(next);
          visitedEdges.add(edgeKey(curr, next));
          prev = curr;
          curr = next;
          if (curr.equals(s.p1)) break;
        }
        stretches.push(new RoadPath(pts));
      }
    }

    return stretches;
  }
}
