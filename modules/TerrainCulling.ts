
import { Segment2D } from './Segment2D';
import { ElevationMap } from './ElevationMap';

export class TerrainCulling {
  /**
   * Filters a list of segments, removing those that are submerged or invalid.
   * 
   * REFINEMENT: Explicitly preserve segments where .isBridge is true.
   * For non-bridge segments, we keep them if both endpoints are on land.
   */
  static cullSegments(segments: Segment2D[], elevation: ElevationMap, waterLevel: number): Segment2D[] {
    return segments.filter(seg => {
      // Priority 1: Protected Infrastructure
      if (seg.isBridge) return true;

      // Priority 2: Land-to-Land connectivity
      const h1 = elevation.getHeight(seg.p1.x, seg.p1.y);
      const h2 = elevation.getHeight(seg.p2.x, seg.p2.y);

      const p1OnLand = h1 >= waterLevel;
      const p2OnLand = h2 >= waterLevel;
      
      return p1OnLand && p2OnLand;
    });
  }
}
