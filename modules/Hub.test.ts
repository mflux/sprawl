
import { Vector2D } from './Vector2D';
import { Hub } from './Hub';
import { TestResult } from '../types';

export const runHubTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  const h1 = new Hub(new Vector2D(0, 0), 10);
  const h2 = new Hub(new Vector2D(15, 0), 10);
  const h3 = new Hub(new Vector2D(50, 50), 10);

  assert('Contains point inside radius', h1.containsPoint(new Vector2D(5, 0)));
  assert('Does not contain point outside radius', !h1.containsPoint(new Vector2D(15, 0)));
  assert('Detects overlap with close hub', h1.overlaps(h2));
  assert('No overlap with distant hub', !h1.overlaps(h3));

  return results;
};
