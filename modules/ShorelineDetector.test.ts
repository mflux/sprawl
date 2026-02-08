
import { Vector2D } from './Vector2D';
import { ElevationMap } from './ElevationMap';
import { ShorelineDetector } from './ShorelineDetector';
import { TestResult } from '../types';

export const runShorelineTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  /**
   * Mock Elevation: Linear slope from left to right.
   * X=0 -> Height 0.0
   * X=100 -> Height 1.0
   */
  const mockElevation = {
    getHeight: (x: number, y: number) => Math.max(0, Math.min(1, x / 100))
  } as ElevationMap;

  // Water level at 0.5. The shoreline should be exactly at X=50.
  const shore = ShorelineDetector.detect(mockElevation, 0.5, 100, 100, 10, 0, 0);

  assert('Detects shoreline segments in simple gradient', shore.length > 0);
  
  // All segments should have X coordinates near 50
  const allAtMid = shore.every(s => Math.abs(s.p1.x - 50) < 1 && Math.abs(s.p2.x - 50) < 1);
  assert('Segments are accurately positioned along the threshold', allAtMid);

  // No shore should be found in a flat desert or deep ocean
  const flatOcean = { getHeight: () => 0.1 } as unknown as ElevationMap;
  const oceanShore = ShorelineDetector.detect(flatOcean, 0.5, 100, 100, 10, 0, 0);
  assert('No segments detected in deep ocean', oceanShore.length === 0);

  return results;
};
