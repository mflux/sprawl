import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { ShapeSpatialGrid } from './ShapeSpatialGrid';
import { TestResult } from '../types';

export const runShapeSpatialGridTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  const grid = new ShapeSpatialGrid(100);

  // Setup: A 50x50 square at (10, 10)
  const shapeA = new Shape2D([
    new Vector2D(10, 10), new Vector2D(60, 10), 
    new Vector2D(60, 60), new Vector2D(10, 60)
  ]);

  // Setup: A distant 50x50 square at (210, 210)
  const shapeB = new Shape2D([
    new Vector2D(210, 210), new Vector2D(260, 210), 
    new Vector2D(260, 260), new Vector2D(210, 260)
  ]);

  grid.insert(shapeA);
  grid.insert(shapeB);

  // Test 1: Candidate Retrieval
  const candidatesNearA = grid.queryCandidates(new Vector2D(20, 20));
  assert('Query returns shape A for points in its cell', candidatesNearA.includes(shapeA));
  assert('Query prunes distant shape B from results', !candidatesNearA.includes(shapeB));

  // Test 2: Multi-cell overlap
  // A shape at (80, 80) to (120, 120) should be in 4 cells (0,0), (1,0), (0,1), (1,1) if cell size is 100
  const shapeC = new Shape2D([
    new Vector2D(80, 80), new Vector2D(120, 80), 
    new Vector2D(120, 120), new Vector2D(80, 120)
  ]);
  grid.insert(shapeC);
  
  const inCell00 = grid.queryCandidates(new Vector2D(50, 50));
  const inCell11 = grid.queryCandidates(new Vector2D(150, 150));
  assert('Large shape is indexed in multiple cells (cell 0,0)', inCell00.includes(shapeC));
  assert('Large shape is indexed in multiple cells (cell 1,1)', inCell11.includes(shapeC));

  // Test 3: Accurate containment
  const found = grid.findShapeAt(new Vector2D(30, 30));
  assert('findShapeAt correctly identifies shape A at point', found === shapeA);
  
  const foundNone = grid.findShapeAt(new Vector2D(150, 50));
  assert('findShapeAt returns null for empty areas even if AABB candidates exist', foundNone === null);

  return results;
};
