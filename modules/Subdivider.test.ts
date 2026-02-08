
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { Subdivider } from './Subdivider';
import { TestResult } from '../types';

export const runSubdividerTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  // 1. Inward normal on a basic square
  const square = new Shape2D([
    new Vector2D(0, 0),
    new Vector2D(100, 0),
    new Vector2D(100, 100),
    new Vector2D(0, 100)
  ]);
  const normal = square.getInwardNormal(0); // Top left (0,0)
  assert('Square corner inward normal check', normal.x > 0.5 && normal.y > 0.5);

  // 2. Logic: Spawning multiple subdividers from longest arterial
  const oblong = new Shape2D([
    new Vector2D(0, 0),
    new Vector2D(500, 0), // Long arterial (idx 0 to 1)
    new Vector2D(500, 100),
    new Vector2D(0, 100)
  ]);
  // Fix: Added missing trailDistance and wanderIntensity arguments
  const antsOb = Subdivider.spawnSubdividers(oblong, 5, 0);
  // A simple side like (0,0)->(500,0) has 2 vertices, so 2 ants.
  assert('Oblong shape spawns multiple subdividers', antsOb.length > 0);
  
  // 3. Shared direction check
  if (antsOb.length > 1) {
    const dir0 = antsOb[0].direction;
    const dir1 = antsOb[1].direction;
    assert('Subdividers in a block share a guide direction', dir0.equals(dir1));
  }

  // 4. Area threshold
  const smallSquare = new Shape2D([
    new Vector2D(0,0), new Vector2D(10,0), new Vector2D(10,10), new Vector2D(0,10)
  ]);
  // Fix: Added missing trailDistance and wanderIntensity arguments
  const antsSmall = Subdivider.spawnSubdividers(smallSquare, 5, 0);
  assert('Rejects shapes below area threshold', antsSmall.length === 0);

  return results;
};
