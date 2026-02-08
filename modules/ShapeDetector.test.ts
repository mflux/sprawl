
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { ShapeDetector } from './ShapeDetector';
import { TestResult } from '../types';

export const runShapeDetectorTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  // 1. Simple Triangle with Overhang
  const p1 = new Vector2D(0, 0);
  const p2 = new Vector2D(50, 0);
  const p3 = new Vector2D(25, 50);
  const pOverhang = new Vector2D(70, 0);

  const triangleSegments = [
    new Segment2D(p1, p2),
    new Segment2D(p2, p3),
    new Segment2D(p3, p1),
    new Segment2D(p2, pOverhang) // The extra leg
  ];

  const shapes1 = ShapeDetector.detectShapes(triangleSegments);
  assert('Detects 1 shape in triangle with overhang', shapes1.length === 1);

  // 2. Square
  const squareSegments = [
    new Segment2D(new Vector2D(100, 100), new Vector2D(200, 100)),
    new Segment2D(new Vector2D(200, 100), new Vector2D(200, 200)),
    new Segment2D(new Vector2D(200, 200), new Vector2D(100, 200)),
    new Segment2D(new Vector2D(100, 200), new Vector2D(100, 100))
  ];
  const shapes2 = ShapeDetector.detectShapes(squareSegments);
  assert('Detects 1 shape in simple square', shapes2.length === 1);

  // 3. Two Adjacent Squares (should find 2 shapes, not just the outer boundary)
  const adjacentSquares = [
    // Square 1
    new Segment2D(new Vector2D(0,0), new Vector2D(10,0)),
    new Segment2D(new Vector2D(10,0), new Vector2D(10,10)),
    new Segment2D(new Vector2D(10,10), new Vector2D(0,10)),
    new Segment2D(new Vector2D(0,10), new Vector2D(0,0)),
    // Square 2 (shares the right edge of Square 1)
    new Segment2D(new Vector2D(10,0), new Vector2D(20,0)),
    new Segment2D(new Vector2D(20,0), new Vector2D(20,10)),
    new Segment2D(new Vector2D(20,10), new Vector2D(10,10))
  ];
  const shapes3 = ShapeDetector.detectShapes(adjacentSquares);
  assert('Detects 2 shapes in adjacent grid', shapes3.length === 2);

  return results;
};
