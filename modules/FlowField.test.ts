
import { FlowField } from './FlowField';
import { Vector2D } from './Vector2D';
import { TestResult } from '../types';

export const runFlowFieldTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  // Create a field centered on 0,0 from -50 to 50
  const field = new FlowField(100, 100, 10, -50, -50);

  // Test 1: Dimensions
  assert('Calculates correct number of columns', field.cols === 11); // 100/10 + 1
  assert('Calculates correct number of rows', field.rows === 11);

  // Test 2: Out of bounds (now supports negative lookups within the bounds)
  const oobFar = field.getVectorAt(-100, -100);
  assert('Returns zero vector for out-of-bounds (far negative)', oobFar.x === 0 && oobFar.y === 0);
  
  const inBoundsNeg = field.getVectorAt(-10, -10);
  assert('Returns valid vector for negative in-bounds coordinate', inBoundsNeg.mag() > 0.99);

  // Test 3: Interpolation
  // We check if getting a vector between grid points returns a normalized vector 
  const v = field.getVectorAt(15, 15);
  assert('Interpolated vector is normalized', Math.abs(v.mag() - 1) < 0.001);

  // Test 4: Continuity
  const v1 = field.getVectorAt(0, 0);
  const v2 = field.getVectorAt(0.1, 0.1);
  const dist = v1.dist(v2);
  assert('Field is continuous (small movement = small vector change)', dist < 0.1);

  return results;
};
