
import { Vector2D } from './Vector2D';
import { SpatialGrid } from './SpatialGrid';
import { TestResult } from '../types';

export const runSpatialGridTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  interface PointItem { id: string; pos: Vector2D }
  const getPos = (i: PointItem) => i.pos;
  
  const grid = new SpatialGrid<PointItem>(50);

  // Test 1: Basic insertion and retrieval
  const p1 = { id: 'a', pos: new Vector2D(10, 10) };
  grid.insert(p1.pos, p1);
  const found = grid.query(new Vector2D(12, 12), 5, getPos);
  assert('Can retrieve item in radius', found.length === 1 && found[0].id === 'a');

  // Test 2: Filtering by radius
  const p2 = { id: 'b', pos: new Vector2D(100, 100) };
  grid.insert(p2.pos, p2);
  const foundNearP1 = grid.query(p1.pos, 10, getPos);
  assert('Query filters out distant items', foundNearP1.length === 1 && foundNearP1[0].id === 'a');

  // Test 3: Multiple cells query
  // p1 is in cell (0,0), p3 is in cell (1,1) if cellSize is 50
  // Center (35,35) with R=40 covers both (10,10) and (60,60) as dist is ~35.3px
  const p3 = { id: 'c', pos: new Vector2D(60, 60) };
  grid.insert(p3.pos, p3);
  const foundBoth = grid.query(new Vector2D(35, 35), 40, getPos);
  assert('Query spans multiple cells correctly', foundBoth.length === 2);

  // Test 4: Clear functionality
  grid.clear();
  const foundEmpty = grid.query(new Vector2D(10, 10), 100, getPos);
  assert('Clear empties the grid', foundEmpty.length === 0);

  return results;
};
