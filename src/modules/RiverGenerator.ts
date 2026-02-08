
import { Vector2D } from './Vector2D';
import { ElevationMap } from './ElevationMap';
import { River } from './River';
import { SimpleNoise } from './FlowField';

export class RiverGenerator {
  private static noise = new SimpleNoise();

  /**
   * Generates a river path by starting at a high point and following a blend of 
   * steepest descent (gravity), procedural noise (meandering), and a global directional bias.
   */
  static generate(
    elevation: ElevationMap, 
    waterLevel: number,
    startPos: Vector2D,
    stepSize: number = 3,
    maxSteps: number = 800,
    globalBias: Vector2D = new Vector2D(0, 0)
  ): River | null {
    const points: Vector2D[] = [startPos.copy()];
    let curr = startPos.copy();
    let velocity = new Vector2D(0, 0);
    
    // Parameters for winding behavior
    const meanderScale = 0.012;
    const meanderStrength = 0.4;
    const gravityStrength = 0.5;
    const biasStrength = 0.15; // Subtle pull to cross bounds
    const momentum = 0.92; // Higher momentum for smoother, longer curves

    for (let i = 0; i < maxSteps; i++) {
      const h = elevation.getHeight(curr.x, curr.y);
      
      // Stop if we hit the sea (with a small buffer)
      if (h < waterLevel - 0.03) break;

      // 1. Calculate Gravity Vector (Steepest Descent)
      const eps = 2.0;
      const hR = elevation.getHeight(curr.x + eps, curr.y);
      const hL = elevation.getHeight(curr.x - eps, curr.y);
      const hD = elevation.getHeight(curr.x, curr.y + eps);
      const hU = elevation.getHeight(curr.x, curr.y - eps);

      const dx = (hR - hL) / (2 * eps);
      const dy = (hD - hU) / (2 * eps);
      const gradient = new Vector2D(dx, dy);
      
      let downhillDir = new Vector2D(0, 0);
      if (gradient.mag() > 0.00001) {
        downhillDir = gradient.normalize().mul(-1);
      }

      // 2. Calculate Meander Vector (Noise-based steering)
      const n = this.noise.noise(curr.x * meanderScale, curr.y * meanderScale);
      const meanderAngle = n * Math.PI * 8; 
      const meanderDir = new Vector2D(Math.cos(meanderAngle), Math.sin(meanderAngle));

      // 3. Blend Forces
      let steer = new Vector2D(0, 0);
      
      // We always add some downhill pull
      if (downhillDir.mag() > 0) {
        steer = steer.add(downhillDir.mul(gravityStrength));
      }
      
      // Meander gives it character
      steer = steer.add(meanderDir.mul(meanderStrength));
      
      // Global Bias ensures it crosses the map even if it hits flat spots or local minima
      if (globalBias.mag() > 0) {
        steer = steer.add(globalBias.normalize().mul(biasStrength));
      }

      steer = steer.normalize();

      // 4. Apply Velocity/Momentum
      velocity = velocity.mul(momentum).add(steer.mul(1 - momentum)).normalize();
      curr = curr.add(velocity.mul(stepSize));

      // 5. Avoid tight loops or self-intersection
      // Only check against older points to allow for gentle turns
      const tooClose = points.some((p, idx) => idx < points.length - 20 && p.dist(curr) < stepSize * 2.5);
      if (tooClose) break;

      points.push(curr.copy());

      // Bounds check for safety (increased for map-wide traversal)
      if (curr.x < -400 || curr.x > 3400 || curr.y < -400 || curr.y > 3400) break;
    }

    if (points.length < 15) return null;
    return new River(points);
  }
}
