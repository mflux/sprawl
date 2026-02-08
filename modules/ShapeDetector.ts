
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { Shape2D } from './Shape2D';

export class ShapeDetector {
  /**
   * Discovers enclosed shapes (faces) from a set of segments.
   */
  static detectShapes(segments: Segment2D[]): Shape2D[] {
    const graph = new Map<string, Vector2D[]>();
    const key = (v: Vector2D) => `${v.x.toFixed(2)},${v.y.toFixed(2)}`;

    // Build adjacency list
    segments.forEach(seg => {
      const k1 = key(seg.p1);
      const k2 = key(seg.p2);
      if (!graph.has(k1)) graph.set(k1, []);
      if (!graph.has(k2)) graph.set(k2, []);
      
      if (!graph.get(k1)!.some(v => key(v) === k2)) graph.get(k1)!.push(seg.p2);
      if (!graph.get(k2)!.some(v => key(v) === k1)) graph.get(k2)!.push(seg.p1);
    });

    const visitedEdges = new Set<string>();
    const edgeKey = (v1: Vector2D, v2: Vector2D) => `${key(v1)}->${key(v2)}`;
    const shapes: Shape2D[] = [];

    for (const [startKey, neighbors] of graph.entries()) {
      const startNode = this.parseKey(startKey);
      for (const neighbor of neighbors) {
        if (visitedEdges.has(edgeKey(startNode, neighbor))) continue;

        const cycle = this.traceFace(startNode, neighbor, graph, visitedEdges, edgeKey);
        if (cycle && cycle.length >= 3) {
          const shape = new Shape2D(cycle);
          if (shape.isSolid()) {
             shapes.push(shape);
          }
        }
      }
    }

    return shapes;
  }

  private static parseKey(k: string): Vector2D {
    const [x, y] = k.split(',').map(Number);
    return new Vector2D(x, y);
  }

  private static traceFace(
    start: Vector2D, 
    next: Vector2D, 
    graph: Map<string, Vector2D[]>, 
    visited: Set<string>,
    edgeKey: (v1: Vector2D, v2: Vector2D) => string
  ): Vector2D[] | null {
    const face: Vector2D[] = [start];
    let curr = start;
    let move = next;
    const key = (v: Vector2D) => `${v.x.toFixed(2)},${v.y.toFixed(2)}`;

    while (true) {
      const eK = edgeKey(curr, move);
      if (visited.has(eK)) return null;
      visited.add(eK);
      face.push(move);

      // Safety hatch increased to allow for massive blocks (e.g. city-bordering parks)
      if (face.length > 1000) return null;

      const neighbors = graph.get(key(move));
      if (!neighbors || neighbors.length < 2) return null;

      const prevDir = curr.sub(move).normalize();
      const prevAngle = Math.atan2(prevDir.y, prevDir.x);

      let bestAngle = -Infinity;
      let bestNeighbor: Vector2D | null = null;

      for (const n of neighbors) {
        if (key(n) === key(curr)) continue;
        const dir = n.sub(move).normalize();
        const angle = Math.atan2(dir.y, dir.x);
        
        // Calculate relative angle (0 to 2PI) safely
        let diff = angle - prevAngle;
        diff = ((diff % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);

        if (diff > bestAngle) {
          bestAngle = diff;
          bestNeighbor = n;
        }
      }

      if (!bestNeighbor) return null;
      if (key(bestNeighbor) === key(start)) {
        visited.add(edgeKey(move, bestNeighbor));
        return face;
      }

      curr = move;
      move = bestNeighbor;
    }
  }
}
