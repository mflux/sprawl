
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { ElevationMap } from './ElevationMap';

/**
 * ShorelineDetector uses the Marching Squares algorithm to extract 
 * precise vector segments representing the transition from land to water.
 */
export class ShorelineDetector {
  /**
   * Detects shorelines within a bounding box.
   * resolution: size of the sample cell (smaller = more detailed but slower)
   */
  static detect(
    elevation: ElevationMap,
    waterLevel: number,
    width: number,
    height: number,
    resolution: number = 10,
    originX: number = 0,
    originY: number = 0
  ): Segment2D[] {
    const shorelines: Segment2D[] = [];
    const cols = Math.ceil(width / resolution);
    const rows = Math.ceil(height / resolution);

    // 1. Pre-sample heights at grid intersections
    const grid: number[][] = [];
    for (let x = 0; x <= cols; x++) {
      grid[x] = [];
      for (let y = 0; y <= rows; y++) {
        grid[x][y] = elevation.getHeight(originX + x * resolution, originY + y * resolution);
      }
    }

    // 2. Linear Interpolation helper to find the exact threshold point
    const lerpPoint = (p1: Vector2D, p2: Vector2D, h1: number, h2: number) => {
      const t = (waterLevel - h1) / (h2 - h1);
      return p1.add(p2.sub(p1).mul(t));
    };

    // 3. March through each cell
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        // Corner world positions
        const pTL = new Vector2D(originX + x * resolution, originY + y * resolution);
        const pTR = new Vector2D(originX + (x + 1) * resolution, originY + y * resolution);
        const pBR = new Vector2D(originX + (x + 1) * resolution, originY + (y + 1) * resolution);
        const pBL = new Vector2D(originX + x * resolution, originY + (y + 1) * resolution);

        // Corner heights
        const hTL = grid[x][y];
        const hTR = grid[x + 1][y];
        const hBR = grid[x + 1][y + 1];
        const hBL = grid[x][y + 1];

        // Binary configuration (1 = below water level)
        let config = 0;
        if (hTL < waterLevel) config += 8;
        if (hTR < waterLevel) config += 4;
        if (hBR < waterLevel) config += 2;
        if (hBL < waterLevel) config += 1;

        // Intersection points on edges
        const eTop = lerpPoint(pTL, pTR, hTL, hTR);
        const eRight = lerpPoint(pTR, pBR, hTR, hBR);
        const eBottom = lerpPoint(pBL, pBR, hBL, hBR);
        const eLeft = lerpPoint(pTL, pBL, hTL, hBL);

        // Map config to segments (standard Marching Squares cases)
        switch (config) {
          case 1: case 14: shorelines.push(new Segment2D(eLeft, eBottom)); break;
          case 2: case 13: shorelines.push(new Segment2D(eBottom, eRight)); break;
          case 3: case 12: shorelines.push(new Segment2D(eLeft, eRight)); break;
          case 4: case 11: shorelines.push(new Segment2D(eTop, eRight)); break;
          case 5: // Saddle point
            shorelines.push(new Segment2D(eTop, eLeft));
            shorelines.push(new Segment2D(eRight, eBottom));
            break;
          case 6: case 9: shorelines.push(new Segment2D(eTop, eBottom)); break;
          case 7: case 8: shorelines.push(new Segment2D(eTop, eLeft)); break;
          case 10: // Saddle point
            shorelines.push(new Segment2D(eTop, eRight));
            shorelines.push(new Segment2D(eLeft, eBottom));
            break;
          default: break; // Cases 0 and 15 are all-land or all-water
        }
      }
    }

    return shorelines;
  }
}
