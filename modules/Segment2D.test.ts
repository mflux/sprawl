
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { TestResult } from '../types';

export const runSegmentTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  // Test 1: Simple intersection
  const s1 = new Segment2D(new Vector2D(0, 0), new Vector2D(10, 10));
  const s2 = new Segment2D(new Vector2D(0, 10), new Vector2D(10, 0));
  const intersect = s1.intersect(s2);
  assert('Segments should intersect at (5,5)', !!intersect && intersect.equals(new Vector2D(5, 5)));

  // Test 2: Parallel segments
  const s3 = new Segment2D(new Vector2D(0, 0), new Vector2D(0, 10));
  const s4 = new Segment2D(new Vector2D(5, 0), new Vector2D(5, 10));
  assert('Parallel segments should not intersect', s3.intersect(s4) === null);

  // Test 3: Shared vertex
  const s5 = new Segment2D(new Vector2D(10, 10), new Vector2D(20, 20));
  const shared = s1.sharesVertex(s5);
  assert('Segments should share vertex at (10,10)', !!shared && shared.equals(new Vector2D(10, 10)));

  // Test 4: Overlap (Collinear)
  const sOverlap1 = new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0));
  const sOverlap2 = new Segment2D(new Vector2D(5, 0), new Vector2D(15, 0));
  assert('Segments should detect collinear overlap', sOverlap1.overlaps(sOverlap2));

  // Test 5: Same segment
  assert('Identical segments should be equal', sOverlap1.equals(new Segment2D(new Vector2D(10, 0), new Vector2D(0, 0))));

  return results;
};
