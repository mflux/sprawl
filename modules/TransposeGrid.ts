
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { Shape2D } from './Shape2D';
import { FlowField, SimpleNoise } from './FlowField';

const noise = new SimpleNoise();

export class TransposeGrid {
  /**
   * Generates a 2D mesh of vertices in a grid pattern.
   */
  static generateMesh(
    center: Vector2D,
    width: number,
    height: number,
    colSpacing: number,
    rowSpacing: number,
    rotation: number = 0
  ): Vector2D[][] {
    const mesh: Vector2D[][] = [];
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    const rotate = (p: Vector2D) => {
      const rx = p.x * cos - p.y * sin;
      const ry = p.x * sin + p.y * cos;
      return new Vector2D(rx + center.x, ry + center.y);
    };

    const halfW = width / 2;
    const halfH = height / 2;

    for (let x = -halfW; x <= halfW + 0.01; x += colSpacing) {
      const col: Vector2D[] = [];
      for (let y = -halfH; y <= halfH + 0.01; y += rowSpacing) {
        col.push(rotate(new Vector2D(x, y)));
      }
      mesh.push(col);
    }
    return mesh;
  }

  /**
   * Applies 2D noise warp to a mesh of vertices.
   * If flowField is provided, sampling is done in world-space for global consistency.
   */
  static warpMesh(mesh: Vector2D[][], intensity: number, flowField?: FlowField): Vector2D[][] {
    if (intensity === 0) return mesh;
    
    // Scale factor to map world coordinates to noise space nicely
    const noiseScale = 0.005;

    return mesh.map((col, x) => 
      col.map((v, y) => {
        let nx, ny;
        if (flowField) {
          nx = flowField.noiseGen.noise(v.x * noiseScale, v.y * noiseScale);
          ny = flowField.noiseGen.noise(v.x * noiseScale + 123.4, v.y * noiseScale + 123.4);
        } else {
          nx = noise.noise(x * 0.2, y * 0.2);
          ny = noise.noise(x * 0.2 + 10, y * 0.2 + 10);
        }
        return v.add(new Vector2D(nx * intensity, ny * intensity));
      })
    );
  }

  /**
   * Relaxes the mesh using Laplacian smoothing (each point moves toward neighbor average).
   */
  static relaxMesh(mesh: Vector2D[][], iterations: number): Vector2D[][] {
    if (iterations <= 0) return mesh;
    let currentMesh = mesh.map(col => col.map(v => v.copy()));

    for (let i = 0; i < iterations; i++) {
      const nextMesh = currentMesh.map(col => col.map(v => v.copy()));
      for (let x = 0; x < currentMesh.length; x++) {
        for (let y = 0; y < currentMesh[x].length; y++) {
          // Boundary vertices stay fixed to maintain grid extent
          if (x === 0 || x === currentMesh.length - 1 || y === 0 || y === currentMesh[x].length - 1) continue;

          const neighbors = [
            currentMesh[x-1][y],
            currentMesh[x+1][y],
            currentMesh[x][y-1],
            currentMesh[x][y+1]
          ];

          const avg = neighbors.reduce((acc, n) => acc.add(n), new Vector2D(0, 0)).div(neighbors.length);
          // Apply a gentle pull (0.5 weight) for smooth results
          nextMesh[x][y] = currentMesh[x][y].add(avg.sub(currentMesh[x][y]).mul(0.5));
        }
      }
      currentMesh = nextMesh;
    }
    return currentMesh;
  }

  /**
   * Converts a mesh into a flat list of segments.
   */
  static meshToSegments(mesh: Vector2D[][]): Segment2D[] {
    const segments: Segment2D[] = [];
    if (mesh.length === 0) return segments;

    for (let x = 0; x < mesh.length; x++) {
      for (let y = 0; y < mesh[x].length; y++) {
        // Vertical connection
        if (y < mesh[x].length - 1) {
          segments.push(new Segment2D(mesh[x][y], mesh[x][y+1]));
        }
        // Horizontal connection
        if (x < mesh.length - 1) {
          segments.push(new Segment2D(mesh[x][y], mesh[x+1][y]));
        }
      }
    }
    return segments;
  }

  /**
   * Generates a raw rectangular grid of segments centered at a position.
   * Now includes support for warp and relax.
   */
  static generateRawGrid(
    center: Vector2D,
    width: number,
    height: number,
    colSpacing: number,
    rowSpacing: number,
    rotation: number = 0,
    warpIntensity: number = 0,
    relaxIterations: number = 0,
    flowField?: FlowField
  ): Segment2D[] {
    let mesh = this.generateMesh(center, width, height, colSpacing, rowSpacing, rotation);
    mesh = this.warpMesh(mesh, warpIntensity, flowField);
    mesh = this.relaxMesh(mesh, relaxIterations);
    return this.meshToSegments(mesh);
  }

  /**
   * Clips a set of grid segments to the interior of a Shape2D.
   * Splits segments at boundaries and removes any parts outside.
   * Includes vertex snapping to prevent sliver polygons.
   */
  static clipGridToShape(grid: Segment2D[], shape: Shape2D, snapThreshold: number = 8): Segment2D[] {
    const clipped: Segment2D[] = [];
    const boundary = shape.toSegments();
    const EPS = 0.01;

    grid.forEach(gridSeg => {
      // Find all intersection points with the shape boundary
      const intersectionPoints: Vector2D[] = [];
      boundary.forEach(edge => {
        const hit = gridSeg.intersect(edge);
        if (hit) {
          // Snap the intersection to the nearest edge vertex if within threshold
          let finalHit = hit;
          if (hit.dist(edge.p1) < snapThreshold) {
            finalHit = edge.p1.copy();
          } else if (hit.dist(edge.p2) < snapThreshold) {
            finalHit = edge.p2.copy();
          }

          // Avoid duplicates
          if (!intersectionPoints.some(p => p.equals(finalHit, EPS))) {
            intersectionPoints.push(finalHit);
          }
        }
      });

      // Combine with original endpoints
      const points = [gridSeg.p1, gridSeg.p2, ...intersectionPoints];

      // Sort points along the segment direction to create sub-segments
      const dir = gridSeg.p2.sub(gridSeg.p1).normalize();
      points.sort((a, b) => {
        const da = a.sub(gridSeg.p1).dot(dir);
        const db = b.sub(gridSeg.p1).dot(dir);
        return da - db;
      });

      // Create and test sub-segments
      for (let i = 0; i < points.length - 1; i++) {
        const pA = points[i];
        const pB = points[i + 1];
        
        // Skip tiny segments
        if (pA.dist(pB) < snapThreshold * 0.5) continue;

        const subSeg = new Segment2D(pA, pB);
        const mid = subSeg.midpoint();

        // If the midpoint is inside the shape, it's a valid interior segment
        if (shape.containsPoint(mid)) {
          clipped.push(subSeg);
        }
      }
    });

    return clipped;
  }
}
