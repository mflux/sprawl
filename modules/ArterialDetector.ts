
import { Vector2D } from './Vector2D';
import { Path2D } from './Path2D';
import { Shape2D } from './Shape2D';

export class ArterialDetector {
  /**
   * Identifies "main paths" (arteries) by grouping connected segments that don't
   * exceed a turn threshold. 
   */
  static detectArterialsFromShapes(shapes: Shape2D[], angleThresholdDeg: number = 50): Path2D[] {
    const arterials: Path2D[] = [];
    const thresholdRad = (angleThresholdDeg * Math.PI) / 180;
    const EPSILON = 0.01;

    shapes.forEach(shape => {
      // 1. Clean points: remove consecutive duplicates
      const pts: Vector2D[] = [];
      shape.points.forEach(p => {
        if (pts.length === 0 || p.dist(pts[pts.length - 1]) > EPSILON) {
          pts.push(p);
        }
      });

      // Handle closed loop duplicate at end
      if (pts.length > 2 && pts[0].dist(pts[pts.length - 1]) < EPSILON) {
        pts.pop();
      }

      if (pts.length < 2) return;

      // 2. Identify all "sharp" vertices
      const sharpIndices = new Set<number>();
      for (let i = 0; i < pts.length; i++) {
        const pPrev = pts[(i - 1 + pts.length) % pts.length];
        const pCurr = pts[i];
        const pNext = pts[(i + 1) % pts.length];

        const dIn = pCurr.dist(pPrev);
        const dOut = pNext.dist(pCurr);

        if (dIn < EPSILON || dOut < EPSILON) continue;

        const vIn = pCurr.sub(pPrev).normalize();
        const vOut = pNext.sub(pCurr).normalize();

        const dot = Math.max(-1, Math.min(1, vIn.dot(vOut)));
        const turnAngle = Math.acos(dot);

        if (turnAngle > thresholdRad) {
          sharpIndices.add(i);
        }
      }

      // 3. One continuous loop if no sharp corners
      if (sharpIndices.size === 0) {
        arterials.push(new Path2D([...pts], true));
        return;
      }

      // 4. Decompose the boundary into segments starting from a sharp corner
      const indicesArray = Array.from(sharpIndices).sort((a, b) => a - b);
      const startIdx = indicesArray[0];
      let currentPathPoints: Vector2D[] = [pts[startIdx]];

      for (let i = 1; i <= pts.length; i++) {
        const currIdx = (startIdx + i) % pts.length;
        currentPathPoints.push(pts[currIdx]);

        if (sharpIndices.has(currIdx)) {
          if (currentPathPoints.length >= 2) {
            arterials.push(new Path2D([...currentPathPoints], false));
          }
          currentPathPoints = [pts[currIdx]];
        }
      }
    });

    return this.deduplicateArterials(arterials);
  }

  private static deduplicateArterials(paths: Path2D[]): Path2D[] {
    const unique: Path2D[] = [];
    paths.forEach(p => {
      if (p.points.length < 2) return;
      
      const isDuplicate = unique.some(u => {
        if (u.points.length !== p.points.length) return false;
        
        const pStart = p.points[0];
        const pEnd = p.points[p.points.length - 1];
        const uStart = u.points[0];
        const uEnd = u.points[u.points.length - 1];

        // Check if endpoints match (bidirectionally)
        const endpointsMatch = (pStart.equals(uStart) && pEnd.equals(uEnd)) || 
                               (pStart.equals(uEnd) && pEnd.equals(uStart));
        
        if (!endpointsMatch) return false;

        // For paths with more than 2 points, verify mid-point to avoid false positive on loops
        if (p.points.length > 2) {
           const pMid = p.points[Math.floor(p.points.length / 2)];
           return u.points.some(up => up.equals(pMid));
        }

        return true;
      });

      if (!isDuplicate) {
        unique.push(p);
      }
    });
    return unique;
  }
}
