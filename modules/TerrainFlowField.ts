
import { Vector2D } from './Vector2D';
import { FlowField } from './FlowField';
import { ElevationMap } from './ElevationMap';

export class TerrainFlowField extends FlowField {
  constructor(
    public elevation: ElevationMap,
    public waterLevel: number,
    width: number,
    height: number,
    resolution: number = 20,
    originX: number = 0,
    originY: number = 0,
    scaleLarge: number = 0.05,
    scaleSmall: number = 0.2
  ) {
    super(width, height, resolution, originX, originY, scaleLarge, scaleSmall);
  }

  /**
   * Samples elevation gradients and curvature to guide flow.
   * Incorporates aggressive "Shoreline Repulsion" to prevent land agents from entering water.
   */
  public getVectorAt(x: number, y: number): Vector2D {
    const baseVector = super.getVectorAt(x, y);
    
    const h = this.elevation.getHeight(x, y);
    const isInWater = h < this.waterLevel;
    
    // Sampling distance
    const eps = isInWater ? 3.0 : 1.5; 
    
    const hR = this.elevation.getHeight(x + eps, y);
    const hL = this.elevation.getHeight(x - eps, y);
    const hD = this.elevation.getHeight(x, y + eps);
    const hU = this.elevation.getHeight(x, y - eps);

    const dx = (hR - hL) / (2 * eps);
    const dy = (hD - hU) / (2 * eps);
    const gradient = new Vector2D(dx, dy);
    const steepness = gradient.mag();

    if (steepness < 0.0001) return baseVector;

    // Deciding tangent direction based on base noise flow for global consistency
    const t1 = new Vector2D(-dy, dx).normalize();
    const t2 = new Vector2D(dy, -dx).normalize();
    const tangent = baseVector.dot(t1) > baseVector.dot(t2) ? t1 : t2;

    if (isInWater) {
      // IN WATER: Strong drive back to land + sliding
      const landSeeker = gradient.normalize();
      const waterFlow = landSeeker.mul(0.3).add(tangent.mul(0.7)).normalize();
      return baseVector.mul(0.1).add(waterFlow.mul(0.9)).normalize();
    } else {
      // ON LAND:
      const downhill = gradient.mul(-1).normalize();
      const uphill = gradient.normalize();
      
      // Proximity to water (0 = far inland, 1 = at shore)
      // Increase buffer to 0.15 height units to start "banking" early
      const shoreProximity = Math.max(0, 1 - (h - this.waterLevel) / 0.15);
      
      let terrestrialFlow: Vector2D;

      if (shoreProximity > 0.05) {
        // Near Shore: Repel!
        // We blend "Uphill" (away from water) with "Tangent" (sliding along)
        // This ensures we don't just stop at the shore, we turn.
        const repulsionForce = shoreProximity * 0.5; // Stronger as we get closer
        const slideForce = 1.0 - repulsionForce;
        
        terrestrialFlow = uphill.mul(repulsionForce)
                                .add(tangent.mul(slideForce))
                                .normalize();
      } else {
        // Inland: Flow downhill as usual
        terrestrialFlow = downhill;
      }

      // Final blend: Near shore, the environment DOMINATES noise to ensure safety
      const terrainInfluence = Math.min(0.95, (steepness * 40) + (shoreProximity * 0.8)); 
      return baseVector.mul(1 - terrainInfluence).add(terrestrialFlow.mul(terrainInfluence)).normalize();
    }
  }
}
