
import { Vector2D } from './Vector2D';
import { Ant } from './Ant';
import { TestResult } from '../types';

export const runBridgeAntTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  const start = new Vector2D(0, 0);
  const target = new Vector2D(200, 0);

  // 1. Water Survival
  const bridgeAnt = new Ant(start, target, { type: 'bridge', speed: 2 });
  // Mock a terrain flow field with water at (10,0)
  const mockFlowField: any = {
    elevation: { getHeight: () => 0.1 }, // Always deep water
    waterLevel: 0.5,
    getVectorAt: () => new Vector2D(0, 1) // Force pushing down
  };

  const updateResult = bridgeAnt.update(mockFlowField, 1.0);
  assert('Bridge ant does not die in water', updateResult !== 'death_water' && bridgeAnt.isAlive);

  // 2. High Inertia / Straightness
  const initialDir = bridgeAnt.direction.copy();
  // Even with strong perpendicular flow, bridge ants should stay mostly on course
  assert('Bridge ant ignores environmental steering forces', Math.abs(bridgeAnt.direction.dot(initialDir)) > 0.99);

  // 3. Reaching Target
  bridgeAnt.position = new Vector2D(199, 0);
  const finalResult = bridgeAnt.update();
  assert('Bridge ant stops when reaching world-space target', finalResult === 'target_reached');

  return results;
};
