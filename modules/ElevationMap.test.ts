
import { ElevationMap } from './ElevationMap';
import { TestResult } from '../types';

export const runElevationTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  const map = new ElevationMap(12345);

  // Test 1: Range
  const heights = Array.from({ length: 100 }, () => map.getHeight(Math.random() * 1000, Math.random() * 1000));
  const allInRange = heights.every(h => h >= 0 && h <= 1);
  assert('Elevation values are normalized between 0 and 1', allInRange);

  // Test 2: Continuity
  const h1 = map.getHeight(100, 100);
  const h2 = map.getHeight(100.1, 100.1);
  const diff = Math.abs(h1 - h2);
  assert('Elevation is spatially continuous (smooth)', diff < 0.05);

  // Test 3: Deterministic check
  const hA = map.getHeight(500, 500);
  const hB = map.getHeight(500, 500);
  assert('Height calculation is deterministic for same seed/coords', hA === hB);

  // Test 4: Water Level Categorization
  assert('Low heights are categorized as water', map.getCategory(0.1, 0.3) === 'water');
  assert('High heights are categorized as snow', map.getCategory(0.95, 0.3) === 'snow');

  return results;
};
