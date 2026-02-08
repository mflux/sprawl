
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { ElevationMap } from './ElevationMap';

export interface PathNode {
  pos: Vector2D;
  g: number; // Cost from start
  h: number; // Heuristic to end
  f: number; // Total cost
  parent: PathNode | null;
  id: string;
}

export class Pathfinder {
  /**
   * Finds the shortest path between start and end using A* algorithm on a segment-based network.
   * @param start Position to start from (snaps to nearest network node)
   * @param end Position to reach (snaps to nearest network node)
   * @param segments The road network to traverse
   * @param elevation Optional terrain map to calculate uphill costs
   * @param slopeSensitivity Multiplier for elevation-based cost (default 10.0)
   */
  static findPath(
    start: Vector2D,
    end: Vector2D,
    segments: Segment2D[],
    elevation?: ElevationMap,
    slopeSensitivity: number = 10.0
  ): Vector2D[] | null {
    if (segments.length === 0) return null;

    // 1. Build Adjacency Graph from segments
    // We use a precision-limited key to handle tiny floating point variations
    const adj = new Map<string, { pos: Vector2D, neighbors: { to: string, cost: number }[] }>();
    const key = (v: Vector2D) => `${Math.round(v.x * 100) / 100},${Math.round(v.y * 100) / 100}`;

    segments.forEach(s => {
      const k1 = key(s.p1);
      const k2 = key(s.p2);
      
      if (!adj.has(k1)) adj.set(k1, { pos: s.p1, neighbors: [] });
      if (!adj.has(k2)) adj.set(k2, { pos: s.p2, neighbors: [] });

      const dist = s.length();
      let cost1to2 = dist;
      let cost2to1 = dist;

      if (elevation) {
        const h1 = elevation.getHeight(s.p1.x, s.p1.y);
        const h2 = elevation.getHeight(s.p2.x, s.p2.y);
        const dh = h2 - h1;
        
        // Uphill is exponentially more expensive
        // Downhill is slightly cheaper than flat but bounded
        cost1to2 *= (1 + Math.max(0, dh * slopeSensitivity));
        cost2to1 *= (1 + Math.max(0, -dh * slopeSensitivity));
      }

      adj.get(k1)!.neighbors.push({ to: k2, cost: cost1to2 });
      adj.get(k2)!.neighbors.push({ to: k1, cost: cost2to1 });
    });

    // 2. Find nearest graph nodes to requested start/end positions
    let startKey = '';
    let endKey = '';
    let minDistS = Infinity;
    let minDistE = Infinity;

    for (const [k, node] of adj.entries()) {
      const ds = node.pos.dist(start);
      const de = node.pos.dist(end);
      if (ds < minDistS) { minDistS = ds; startKey = k; }
      if (de < minDistE) { minDistE = de; endKey = k; }
    }

    if (!startKey || !endKey) return null;

    // 3. A* Search Implementation
    const openSet: Map<string, PathNode> = new Map();
    const closedSet: Set<string> = new Set();

    const startPos = adj.get(startKey)!.pos;
    const endPos = adj.get(endKey)!.pos;

    const startNode: PathNode = {
      pos: startPos,
      g: 0,
      h: startPos.dist(endPos),
      f: startPos.dist(endPos),
      parent: null,
      id: startKey
    };

    openSet.set(startKey, startNode);

    while (openSet.size > 0) {
      // Find node in open set with lowest F cost
      let currentKey = '';
      let current: PathNode | null = null;
      for (const [k, node] of openSet.entries()) {
        if (!current || node.f < current.f) {
          current = node;
          currentKey = k;
        }
      }

      if (!current) break;

      // Reached goal?
      if (currentKey === endKey) {
        const path: Vector2D[] = [];
        let temp: PathNode | null = current;
        while (temp) {
          path.unshift(temp.pos);
          temp = temp.parent;
        }
        return path;
      }

      openSet.delete(currentKey);
      closedSet.add(currentKey);

      const nodeInfo = adj.get(currentKey);
      if (!nodeInfo) continue;

      for (const edge of nodeInfo.neighbors) {
        if (closedSet.has(edge.to)) continue;

        const neighborInfo = adj.get(edge.to)!;
        const neighborPos = neighborInfo.pos;
        const tentativeG = current.g + edge.cost;

        let neighborNode = openSet.get(edge.to);
        if (!neighborNode || tentativeG < neighborNode.g) {
          const h = neighborPos.dist(endPos);
          neighborNode = {
            pos: neighborPos,
            g: tentativeG,
            h: h,
            f: tentativeG + h,
            parent: current,
            id: edge.to
          };
          openSet.set(edge.to, neighborNode);
        }
      }
    }

    return null; // No path found in disconnected network
  }
}
