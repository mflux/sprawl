
import { Shape2D } from './Shape2D';
import { Ant } from './Ant';
import { Vector2D } from './Vector2D';
import { ArterialDetector } from './ArterialDetector';
import { Path2D } from './Path2D';

export class Subdivider {
  /**
   * Wave 0:
   * Identifies the longest arterial forming the block's boundary, 
   * calculates a shared inward guide vector from its midpoint, 
   * and spawns ants at every vertex. One ant is designated "Primary".
   * 
   * Wave 1:
   * Takes the path recorded by the Primary ant of Wave 0 and spawns
   * ants perpendicular to the original guide vector from every recorded point.
   */
  static spawnSubdividers(shape: Shape2D, trailDistance: number, wanderIntensity: number, wave: number = 0, guidePath?: Vector2D[]): Ant[] {
    const area = Math.abs(shape.getSignedArea());
    if (area < 1500) return [];

    if (wave === 0) {
      return this.spawnWave0(shape, trailDistance, wanderIntensity);
    } else {
      return this.spawnWave1(shape, trailDistance, wanderIntensity, guidePath || []);
    }
  }

  private static spawnWave0(shape: Shape2D, trailDistance: number, wanderIntensity: number): Ant[] {
    const localArterials = ArterialDetector.detectArterialsFromShapes([shape], 50);
    if (localArterials.length === 0) return [];

    const getPathLength = (p: Path2D) => p.toSegments().reduce((sum, seg) => sum + seg.length(), 0);

    let mainArt: Path2D = localArterials[0];
    let maxLength = -1;
    localArterials.forEach(art => {
      const l = getPathLength(art);
      if (l > maxLength) {
        maxLength = l;
        mainArt = art;
      }
    });

    const halfLen = maxLength / 2;
    let accumulated = 0;
    let midVertex = mainArt.points[0];
    const mainSegments = mainArt.toSegments();
    for (const seg of mainSegments) {
      const d = seg.length();
      if (accumulated + d >= halfLen) {
        const distToP1 = Math.abs(halfLen - accumulated);
        const distToP2 = Math.abs(halfLen - (accumulated + d));
        midVertex = distToP1 < distToP2 ? seg.p1 : seg.p2;
        break;
      }
      accumulated += d;
    }

    const vertexIndex = shape.points.findIndex(p => p.equals(midVertex));
    if (vertexIndex === -1) return [];

    const guideVector = shape.getInwardNormal(vertexIndex);
    shape.guideVector = guideVector.copy();

    const ants: Ant[] = [];
    mainArt.points.forEach((startPos, idx) => {
      const targetPos = startPos.add(guideVector.mul(10000));
      const isPrimary = startPos.equals(midVertex);

      const ant = new Ant(startPos, targetPos, {
        speed: 1.5,
        life: 1500,
        turnSpeed: 0,
        trailDistance: trailDistance,
        wanderIntensity: wanderIntensity,
        id: `sub0-${shape.points.length}-${idx}`,
        isPrimary
      });
      
      ant.parentShape = shape;
      ants.push(ant);
    });

    return ants;
  }

  private static spawnWave1(shape: Shape2D, trailDistance: number, wanderIntensity: number, guidePath: Vector2D[]): Ant[] {
    if (guidePath.length < 2 || !shape.guideVector) return [];

    // Perpendicular directions relative to the primary axis
    const v = shape.guideVector;
    const perp1 = new Vector2D(-v.y, v.x);
    const perp2 = new Vector2D(v.y, -v.x);

    const ants: Ant[] = [];
    
    // We only spawn from every 2nd recorded point to keep the grid spacing clean
    guidePath.forEach((startPos, idx) => {
      if (idx % 2 !== 0) return;

      [perp1, perp2].forEach((dir, dirIdx) => {
        // Validation: Only spawn the ant if it's currently inside the shape
        // and its first move would be inside the shape.
        const testPoint = startPos.add(dir.mul(3));
        if (!shape.containsPoint(testPoint)) return;

        // Target far away to ensure it crosses the boundary
        const targetPos = startPos.add(dir.mul(10000));

        const ant = new Ant(startPos, targetPos, {
          speed: 1.5,
          life: 1500,
          turnSpeed: 0,
          trailDistance: trailDistance,
          wanderIntensity: wanderIntensity,
          id: `sub1-${idx}-${dirIdx}-${Math.random().toString(36).substr(2, 4)}`
        });
        
        ant.parentShape = shape;
        ants.push(ant);
      });
    });

    return ants;
  }
}
