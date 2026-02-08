
import { Vector2D } from './Vector2D';
import { River } from './River';
import { RiverGenerator } from './RiverGenerator';
import { ElevationMap } from './ElevationMap';
import { TestResult } from '../types';

export const runRiverTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  // Mock Elevation: A ramp from Left(High) to Right(Low)
  const mockElevation = {
    getHeight: (x: number, y: number) => 1.0 - (x / 500)
  } as ElevationMap;

  // 1. Generation Test
  const start = new Vector2D(50, 50);
  const river = RiverGenerator.generate(mockElevation, 0.3, start, 10, 50);
  
  assert('River generator creates a path', !!river && river.points.length > 0);
  
  if (river) {
    const end = river.points[river.points.length - 1];
    assert('River flows downhill (X increases in this mock)', end.x > start.x);
  }

  // 2. Influence Test
  const r2 = new River([new Vector2D(0, 0), new Vector2D(100, 0)], 20);
  assert('Influence is 1.0 on the spine', Math.abs(r2.getInfluence(new Vector2D(50, 0)) - 1.0) < 0.01);
  assert('Influence is 0.0 outside width', r2.getInfluence(new Vector2D(50, 30)) === 0);
  assert('Influence is partial at mid-width', r2.getInfluence(new Vector2D(50, 10)) > 0 && r2.getInfluence(new Vector2D(50, 10)) < 1.0);

  return results;
};
