import { Vector2D } from './Vector2D';
import { Capsule2D } from './Capsule2D';
import { TestResult } from '../types';

export const runCapsuleTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  // 1. Parallel but touching via radius
  const c1 = new Capsule2D(new Vector2D(0, 0), new Vector2D(0, 10), 2);
  const c2 = new Capsule2D(new Vector2D(3, 0), new Vector2D(3, 10), 2);
  // Dist between segments is 3. Radii sum is 4. Should intersect.
  assert('Parallel capsules within radius sum should intersect', c1.intersects(c2));

  // 2. Parallel and far apart
  const c3 = new Capsule2D(new Vector2D(10, 0), new Vector2D(10, 10), 2);
  assert('Distant parallel capsules should not intersect', !c1.intersects(c3));

  // 3. T-bone intersection
  const c4 = new Capsule2D(new Vector2D(-5, 5), new Vector2D(5, 5), 1);
  // c1 is (0,0)-(0,10). c4 crosses at (0,5). Segment distance is 0.
  assert('Crossing segments (T-bone) should intersect', c1.intersects(c4));

  // 4. End-to-end touching
  const c5 = new Capsule2D(new Vector2D(0, 13), new Vector2D(0, 20), 2);
  // c1 ends at (0,10), c5 starts at (0,13). Dist is 3. Radii sum is 4.
  assert('Capsules touching end-to-end within radius should intersect', c1.intersects(c5));

  return results;
};
