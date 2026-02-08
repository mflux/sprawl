
import { Vector2D } from './Vector2D';
import { ElevationMap } from './ElevationMap';
import { TerrainFlowField } from './TerrainFlowField';
import { TestResult } from '../types';

export const runTerrainFlowTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  /**
   * Mock Elevation: A steep ramp rising towards the right (X+).
   * Range [-100, 100] maps to [0, 10] Height (Steep slope).
   * dx is constant at 0.05, which is enough to trigger high terrain influence (0.05 * 40 = 2.0 -> capped at 0.95).
   */
  const mockElevation = {
    getHeight: (x: number, y: number) => (x + 100) / 20,
    getCategory: (h: number) => h < 0.3 ? 'water' : 'land',
    getColor: () => '#000'
  } as unknown as ElevationMap;

  const waterLevel = 0.3;
  // Flow field defined from x:[-100, 100], y:[-100, 100]
  const tff = new TerrainFlowField(mockElevation, waterLevel, 200, 200, 10, -100, -100);

  // 1. Test Land Behavior (Downhill)
  // At x=50, Height is significantly above waterLevel.
  // Gradient is (positive_x, 0). Downhill should point LEFT (X < 0).
  const landVec = tff.getVectorAt(50, 0);
  assert('On land, flow is biased downhill (opposite to gradient)', landVec.x < 0);

  // 2. Test Water Behavior (To Land)
  // At x=-95, Height is below waterLevel (0.05 / 20 < 0.3).
  // Gradient is (positive_x, 0). Seeking land should point RIGHT (X > 0).
  const waterVec = tff.getVectorAt(-95, 0);
  assert('In water, flow seeks higher ground (along gradient)', waterVec.x > 0);

  // 3. Test Normalization
  // All vectors returned by getVectorAt should be unit vectors.
  assert('Resulting terrain vectors are normalized', Math.abs(landVec.mag() - 1) < 0.01);
  assert('Water vectors are also normalized', Math.abs(waterVec.mag() - 1) < 0.01);

  return results;
};
