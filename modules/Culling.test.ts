
import { Vector2D } from './Vector2D';
import { TestResult } from '../types';
import { isBoxInView, getPathBounds, ViewBounds } from './Culling';

export const runCullingTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  const bounds: ViewBounds = { minX: 0, minY: 0, maxX: 100, maxY: 100 };

  // Test 1: Full inclusion
  assert('Fully contained box is in view', isBoxInView(10, 10, 20, 20, bounds));

  // Test 2: Edge overlap
  assert('Partially overlapping box is in view', isBoxInView(-10, -10, 10, 10, bounds));

  // Test 3: Path culling logic (Fixing the Endpoint Bug)
  const complexPath = [
    new Vector2D(-100, 50), 
    new Vector2D(50, 50), 
    new Vector2D(-100, 60)
  ];
  
  // INCORRECT LOGIC: Only checking endpoints
  const cFirst = complexPath[0];
  const cLast = complexPath[complexPath.length - 1];
  const culledByBug = (cFirst.x < bounds.minX && cLast.x < bounds.minX);
  
  // CORRECT LOGIC: Check the full AABB
  const pathAABB = getPathBounds(complexPath);
  const visibleByAABB = isBoxInView(pathAABB.minX, pathAABB.minY, pathAABB.maxX, pathAABB.maxY, bounds);
  
  assert('Endpoints-only logic should be identified as buggy', culledByBug === true);
  assert('Full AABB logic correctly identifies paths crossing viewport', visibleByAABB === true);
  assert('Path with middle in view but ends out of view should NOT be culled', visibleByAABB, 'AABB culling must detect middle-segments');

  return results;
};
