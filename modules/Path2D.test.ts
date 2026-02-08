
import { Vector2D } from './Vector2D';
import { Path2D } from './Path2D';
import { Segment2D } from './Segment2D';
import { TestResult } from '../types';

export const runPathTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  // Test 1: Segment Decomposition (Open)
  const p1 = new Path2D([new Vector2D(0,0), new Vector2D(10,0), new Vector2D(10,10)], false);
  const segs1 = p1.toSegments();
  assert('Open path decomposition', segs1.length === 2);

  // Test 2: Segment Decomposition (Closed)
  const p2 = new Path2D([new Vector2D(0,0), new Vector2D(10,0), new Vector2D(10,10)], true);
  const segs2 = p2.toSegments();
  assert('Closed path decomposition (adds loop segment)', segs2.length === 3);

  // Test 3: Intersection with segment
  const p3 = new Path2D([new Vector2D(0,0), new Vector2D(20,0), new Vector2D(20,20)], false);
  const cross = new Segment2D(new Vector2D(10,-10), new Vector2D(10,10));
  const hits = p3.intersectsSegment(cross);
  assert('Path-Segment intersection detection', hits.length === 1 && hits[0].equals(new Vector2D(10,0)));

  // Test 4: Path-Path intersection
  const pathA = new Path2D([new Vector2D(0,0), new Vector2D(20,20)], false);
  const pathB = new Path2D([new Vector2D(0,20), new Vector2D(20,0)], false);
  const pathHits = pathA.intersectsPath(pathB);
  assert('Path-Path intersection detection', pathHits.length === 1 && pathHits[0].equals(new Vector2D(10,10)));

  return results;
};
