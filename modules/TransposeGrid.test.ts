
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { Segment2D } from './Segment2D';
import { TransposeGrid } from './TransposeGrid';
import { TestResult } from '../types';

export const runTransposeGridTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  // 1. Test Grid Generation
  const center = new Vector2D(0, 0);
  const rawGrid = TransposeGrid.generateRawGrid(center, 100, 100, 20, 20);
  // Mesh 100x100 with 20 step is 6x6 points. 
  // Segments: 5 per col (6 cols) + 5 per row (6 rows) = 30 + 30 = 60
  assert('Generates correct number of grid segments', rawGrid.length === 60);

  // 2. Test Warping
  const mesh = TransposeGrid.generateMesh(center, 100, 100, 20, 20);
  const warped = TransposeGrid.warpMesh(mesh, 50);
  let moved = false;
  for(let x=0; x<mesh.length; x++) {
    for(let y=0; y<mesh[x].length; y++) {
      if(!mesh[x][y].equals(warped[x][y])) {
        moved = true;
        break;
      }
    }
  }
  assert('Warping moves vertices from original positions', moved);

  // 3. Test Relaxation (Smoothing)
  const messyMesh = TransposeGrid.warpMesh(mesh, 20);
  const relaxed = TransposeGrid.relaxMesh(messyMesh, 5);
  
  const getMeshLen = (m: Vector2D[][]) => TransposeGrid.meshToSegments(m).reduce((sum, s) => sum + s.length(), 0);
  const messyLen = getMeshLen(messyMesh);
  const relaxedLen = getMeshLen(relaxed);
  
  // Relaxation should generally reduce total edge length (smoothing towards straightness)
  assert('Relaxation smooths the grid (reduces total mesh length)', relaxedLen < messyLen);

  // 4. Test Clipping
  const square = new Shape2D([
    new Vector2D(-50, -50),
    new Vector2D(50, -50),
    new Vector2D(50, 50),
    new Vector2D(-50, 50)
  ]);
  
  const oversizedGrid = TransposeGrid.generateRawGrid(center, 200, 200, 50, 50);
  const clipped = TransposeGrid.clipGridToShape(oversizedGrid, square);

  assert('Clipped grid has segments', clipped.length > 0);
  
  const allInside = clipped.every(s => 
    square.containsPoint(s.midpoint()) || 
    square.containsPoint(s.p1.add(s.p2.sub(s.p1).mul(0.1)))
  );
  assert('All clipped segments are inside or on boundary', allInside);

  // 5. Sliver Reduction (Snapping) Test
  const triangularShape = new Shape2D([
    new Vector2D(0, 0),
    new Vector2D(100, 0),
    new Vector2D(50, 100)
  ]);

  const sliverLine = new Segment2D(new Vector2D(49.5, -50), new Vector2D(49.5, 150));
  
  const noSnap = TransposeGrid.clipGridToShape([sliverLine], triangularShape, 0);
  const topPointNoSnap = noSnap.find(s => s.p1.y > 90 || s.p2.y > 90);
  const hasOriginalX = topPointNoSnap && (topPointNoSnap.p1.x === 49.5 || topPointNoSnap.p2.x === 49.5);
  assert('Without snapping, intersection preserves exact grid coordinate', hasOriginalX === true);

  const snapThreshold = 5;
  const withSnap = TransposeGrid.clipGridToShape([sliverLine], triangularShape, snapThreshold);
  const topPointWithSnap = withSnap.find(s => s.p1.y > 90 || s.p2.y > 90);
  
  const snappedToVertex = topPointWithSnap && (
    topPointWithSnap.p1.equals(new Vector2D(50, 100)) || 
    topPointWithSnap.p2.equals(new Vector2D(50, 100))
  );
  assert('With snapping, near-vertex intersection latches to the vertex', !!snappedToVertex);

  return results;
};
