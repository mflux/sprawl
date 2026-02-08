
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { TestResult } from '../types';

export const runShapeTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  // Test 1: Clockwise Square (Solid in Y-down)
  // (0,0) -> (10,0) -> (10,10) -> (0,10)
  const cwSquare = new Shape2D([
    new Vector2D(0, 0),
    new Vector2D(10, 0),
    new Vector2D(10, 10),
    new Vector2D(0, 10)
  ]);
  assert('CW points should be Solid', cwSquare.isSolid(), `Expected Solid (CW), but Area was ${cwSquare.getSignedArea()}`);

  // Test 2: Counter-Clockwise Square (Hole in Y-down)
  // (0,0) -> (0,10) -> (10,10) -> (10,0)
  const ccwSquare = new Shape2D([
    new Vector2D(0, 0),
    new Vector2D(0, 10),
    new Vector2D(10, 10),
    new Vector2D(10, 0)
  ]);
  assert('CCW points should be Hole', ccwSquare.isHole(), `Expected Hole (CCW), but Area was ${ccwSquare.getSignedArea()}`);

  // Test 3: Shape-Shape Intersection
  const s1 = new Shape2D([new Vector2D(5, 5), new Vector2D(15, 5), new Vector2D(15, 15), new Vector2D(5, 15)]);
  const s2 = new Shape2D([new Vector2D(10, 10), new Vector2D(20, 10), new Vector2D(20, 20), new Vector2D(10, 20)]);
  const hits = s1.intersectsShape(s2);
  assert('Shapes should intersect at 2 points', hits.length === 2);

  // Test 4: Point-in-Polygon
  assert('Point (5,5) should be inside CW square', cwSquare.containsPoint(new Vector2D(5, 5)));
  assert('Point (15,15) should be outside CW square', !cwSquare.containsPoint(new Vector2D(15, 15)));

  return results;
};
