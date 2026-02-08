
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { ElevationMap } from './ElevationMap';
import { TerrainCulling } from './TerrainCulling';
import { TestResult } from '../types';

export const runTerrainCullingTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  // Mock elevation: Land on left (x<50), Water on right (x>=50)
  const mockElevation = {
    getHeight: (x: number, y: number) => x < 50 ? 0.8 : 0.1
  } as ElevationMap;
  const waterLevel = 0.5;

  const segLand = new Segment2D(new Vector2D(10, 10), new Vector2D(40, 10));
  const segWater = new Segment2D(new Vector2D(60, 10), new Vector2D(90, 10));
  const segBridge = new Segment2D(new Vector2D(40, 20), new Vector2D(60, 20)); // Midpoint at 50 (water)

  const input = [segLand, segWater, segBridge];
  const output = TerrainCulling.cullSegments(input, mockElevation, waterLevel);

  assert('Keeps segment fully on land', output.includes(segLand));
  assert('Removes segment fully in water', !output.includes(segWater));
  assert('Removes segment crossing through water (midpoint check)', !output.includes(segBridge));
  assert('Output count is correct', output.length === 1);

  return results;
};
