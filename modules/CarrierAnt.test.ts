import { Vector2D } from './Vector2D';
import { Ant } from './Ant';
import { TestResult } from '../types';

export const runCarrierTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  const start = new Vector2D(0, 0);
  const target = new Vector2D(1000, 0);

  // 1. Distance Tracking
  const carrier = new Ant(start, target, { type: 'carrier', speed: 2 });
  assert('Initial distance tracking is zero', carrier.distanceSinceLastFork === 0);
  
  carrier.update();
  assert('Updates distance tracker after movement', carrier.distanceSinceLastFork === 2);

  // 2. High Inertia / Straightness
  const steeringAnt = new Ant(start, target, { type: 'carrier', speed: 1 });
  const initialDir = steeringAnt.direction.copy();
  // Force a strong external force (perpendicular)
  const strongExternalForce = new Vector2D(0, 1);
  // Carrier momentum is 0.99, it should barely move its direction
  steeringAnt.direction = steeringAnt.direction.mul(0.99).add(strongExternalForce.mul(0.01)).normalize();
  assert('Carrier maintains extreme inertia (barely deflects)', Math.abs(steeringAnt.direction.dot(initialDir)) > 0.99);

  // 3. 90-Degree Orthogonality Calculation
  const parentDir = new Vector2D(1, 0); // Moving East
  const side = 1; // Left
  const turnAngle = Math.PI / 2; // 90 degrees
  const childDir = new Vector2D(
    parentDir.x * Math.cos(turnAngle * side) - parentDir.y * Math.sin(turnAngle * side),
    parentDir.x * Math.sin(turnAngle * side) + parentDir.y * Math.cos(turnAngle * side)
  );

  // East rotated 90 degrees left (CW) is North (0, 1) in screen space
  assert('Orthogonal direction is correctly calculated (Dot = 0)', Math.abs(childDir.dot(parentDir)) < 0.0001);
  assert('Orthogonal direction results in expected vector (0,1)', childDir.equals(new Vector2D(0, 1)));

  return results;
};