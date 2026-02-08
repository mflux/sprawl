
import { Shape2D } from './Shape2D';
import { Segment2D } from './Segment2D';
import { ShapeDetector } from './ShapeDetector';

export class ShapeMerger {
  /**
   * Merges two adjacent shapes into a single shape by removing their shared segments.
   */
  static merge(shapeA: Shape2D, shapeB: Shape2D): Shape2D | null {
    const segsA = shapeA.toSegments();
    const segsB = shapeB.toSegments();

    const uniqueSegments: Segment2D[] = [];

    // Identify shared segments (boundaries that exist in both shapes)
    // and collect only the outer boundary segments.
    const all = [...segsA, ...segsB];
    for (const s of all) {
      const isShared = segsA.some(sa => sa.equals(s)) && segsB.some(sb => sb.equals(s));
      if (!isShared) {
        uniqueSegments.push(s);
      }
    }

    // Detect shapes from the remaining segments. 
    // This effectively finds the combined outer boundary.
    const results = ShapeDetector.detectShapes(uniqueSegments);
    
    // We expect one solid shape representing the union.
    // Filter for solid to avoid any accidental hole detection.
    const solidResults = results.filter(s => s.isSolid());
    
    // Simplify the resulting shape to remove collinear midpoints 
    // where the shared edge used to be.
    return solidResults.length > 0 ? solidResults[0].simplify() : null;
  }

  /**
   * Finds all shapes in a collection that share at least one segment with the target shape.
   */
  static findNeighbors(target: Shape2D, allShapes: Shape2D[]): Shape2D[] {
    const neighbors: Shape2D[] = [];
    const targetSegs = target.toSegments();
    
    for (const other of allShapes) {
      if (other === target) continue;
      const otherSegs = other.toSegments();
      const sharesEdge = targetSegs.some(ts => otherSegs.some(os => ts.equals(os)));
      if (sharesEdge) {
        neighbors.push(other);
      }
    }
    return neighbors;
  }

  /**
   * Automatically merges small shapes into their largest neighbor.
   * This is useful for cleaning up slivers or overly dense block areas.
   */
  static runAutoMerge(shapes: Shape2D[], areaThreshold: number): Shape2D[] {
    let currentShapes = [...shapes];
    let changed = true;
    let iterations = 0;
    const MAX_ITERATIONS = 10;

    while (changed && iterations < MAX_ITERATIONS) {
      changed = false;
      iterations++;
      
      for (let i = 0; i < currentShapes.length; i++) {
        const shape = currentShapes[i];
        const area = Math.abs(shape.getSignedArea());

        if (area < areaThreshold) {
          const neighbors = this.findNeighbors(shape, currentShapes);
          if (neighbors.length > 0) {
            // Pick the neighbor with the largest area to merge into
            neighbors.sort((a, b) => Math.abs(b.getSignedArea()) - Math.abs(a.getSignedArea()));
            const targetNeighbor = neighbors[0];
            
            const merged = this.merge(shape, targetNeighbor);
            if (merged) {
              const neighborIdx = currentShapes.indexOf(targetNeighbor);
              // Remove both old shapes and add the new one
              currentShapes.splice(neighborIdx, 1);
              const currentShapeIdx = currentShapes.indexOf(shape);
              currentShapes.splice(currentShapeIdx, 1);
              currentShapes.push(merged);
              
              changed = true;
              break; // Restart loop to handle new adjacency state
            }
          }
        }
      }
    }

    return currentShapes;
  }
}
