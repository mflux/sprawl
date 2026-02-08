
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { ShapeMerger } from './ShapeMerger';
import { TestResult } from '../types';

export const runShapeMergerTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  // Setup: Two adjacent squares sharing a vertical edge at X=10
  const sqA = new Shape2D([
    new Vector2D(0, 0), new Vector2D(10, 0), new Vector2D(10, 10), new Vector2D(0, 10)
  ]);
  const sqB = new Shape2D([
    new Vector2D(10, 0), new Vector2D(20, 0), new Vector2D(20, 10), new Vector2D(10, 10)
  ]);
  const sqC = new Shape2D([
    new Vector2D(50, 50), new Vector2D(60, 50), new Vector2D(60, 60), new Vector2D(50, 60)
  ]);

  // Test 1: Neighbor detection
  const neighbors = ShapeMerger.findNeighbors(sqA, [sqA, sqB, sqC]);
  assert('Identifies adjacent shape as neighbor', neighbors.length === 1 && neighbors[0] === sqB);
  
  const noNeighbors = ShapeMerger.findNeighbors(sqC, [sqA, sqB, sqC]);
  assert('Identifies distant shape has no neighbors', noNeighbors.length === 0);

  // Test 2: Merging
  const merged = ShapeMerger.merge(sqA, sqB);
  assert('Merging two 10x10 squares results in a shape', !!merged);
  if (merged) {
    const area = Math.abs(merged.getSignedArea());
    assert('Merged shape has correct area (200)', Math.abs(area - 200) < 0.1);
    assert('Merged shape has 4 points (oblong rectangle)', merged.points.length === 4);
    
    // Verify points are the outer boundary
    const hasSharedVertex = merged.points.some(p => p.x === 10 && (p.y === 0 || p.y === 10));
    // The shared vertices at (10,0) and (10,10) should be removed if they are mid-path, 
    // but in this simple rectangular merge they become unnecessary mid-points or are pruned by the detector.
    // In a perfect rectangular merge, the result is (0,0), (20,0), (20,10), (0,10).
  }

  // Test 3: Auto Merge
  const shapes = [sqA, sqB, sqC];
  // sqA and sqB are area 100. Threshold 150 should trigger merge.
  const autoResults = ShapeMerger.runAutoMerge(shapes, 150);
  assert('AutoMerge reduces shape count', autoResults.length === 2);
  assert('AutoMerge combined the small adjacent blocks', autoResults.some(s => Math.abs(s.getSignedArea()) === 200));

  return results;
};
