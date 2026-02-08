
import { Vector2D } from './Vector2D';
import { Ant } from './Ant';
import { TestResult } from '../types';

export const runAntTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  // Basic Setup
  const start = new Vector2D(0, 0);
  const target = new Vector2D(100, 0);

  // Test 1: Life depletion
  const weakAnt = new Ant(start, target, { speed: 10, life: 5 });
  for(let i=0; i<5; i++) weakAnt.update();
  assert('Ant dies after life expires', !weakAnt.isAlive);

  // Test 2: Target reach
  const quickAnt = new Ant(new Vector2D(98, 0), target, { speed: 5 });
  quickAnt.update();
  assert('Ant dies when reaching target radius', !quickAnt.isAlive);

  // Test 3: Steering Behavior
  // Start facing completely away (up) from target (right)
  const steeringAnt = new Ant(new Vector2D(0, 0), new Vector2D(100, 0), { 
    speed: 1, 
    turnSpeed: 0.1 
  });
  steeringAnt.direction = new Vector2D(0, -1); // Force direction upwards
  
  const initialDir = steeringAnt.direction.copy();
  steeringAnt.update();
  const dirAfterOneStep = steeringAnt.direction.copy();
  
  // After one step, it should have moved its direction towards (1, 0)
  assert('Direction changes after update (steering applied)', !dirAfterOneStep.equals(initialDir));
  assert('Steers towards target (X component increases)', dirAfterOneStep.x > initialDir.x);

  // Test 4: Head-on collision logic
  const antA = new Ant(new Vector2D(0, 0), new Vector2D(100, 0)); // Facing right
  antA.direction = new Vector2D(1, 0);
  const antB = new Ant(new Vector2D(5, 0), new Vector2D(-100, 0)); // Facing left
  antB.direction = new Vector2D(-1, 0);
  assert('Collision detected when facing each other', Ant.checkCollision(antA, antB));

  const antC = new Ant(new Vector2D(0, 0), new Vector2D(100, 0)); 
  antC.direction = new Vector2D(1, 0);
  const antD = new Ant(new Vector2D(5, 0), new Vector2D(105, 0)); 
  antD.direction = new Vector2D(1, 0);
  assert('No collision when moving in same direction', !Ant.checkCollision(antC, antD));

  return results;
};
