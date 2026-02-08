
import { Vector2D } from './Vector2D';
import { TestResult } from '../types';

export const runVectorTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  // Test Addition
  const v1 = new Vector2D(10, 20);
  const v2 = new Vector2D(5, 5);
  const v3 = v1.add(v2);
  assert('Addition adds components correctly', v3.x === 15 && v3.y === 25);

  // Test Magnitude
  const v4 = new Vector2D(3, 4);
  assert('Magnitude calculation (Pythagorean)', v4.mag() === 5);

  // Test Normalization
  const v5 = new Vector2D(10, 0);
  const v6 = v5.normalize();
  assert('Normalization results in unit length', v6.mag() === 1 && v6.x === 1);

  // Test Dot Product
  const v7 = new Vector2D(1, 0);
  const v8 = new Vector2D(0, 1);
  assert('Dot product of perpendicular vectors is 0', v7.dot(v8) === 0);

  // Test Subtraction
  const v9 = v1.sub(v2);
  assert('Subtraction subtracts components correctly', v9.x === 5 && v9.y === 15);

  return results;
};
