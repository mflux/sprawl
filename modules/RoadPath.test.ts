
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { RoadPath } from './RoadPath';
import { TestResult } from '../types';

export const runRoadPathTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  // 1. Single stretch detection
  const segs1 = [
    new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0)),
    new Segment2D(new Vector2D(10, 0), new Vector2D(20, 0)),
    new Segment2D(new Vector2D(20, 0), new Vector2D(30, 0))
  ];
  const stretches1 = RoadPath.detectStretches(segs1);
  assert('Detects single continuous stretch', stretches1.length === 1);
  assert('Stretch has correct point count', stretches1[0].points.length === 4);
  assert('Stretch length is correct', stretches1[0].length() === 30);

  // 2. Fork detection
  const segs2 = [
    ...segs1,
    new Segment2D(new Vector2D(10, 0), new Vector2D(10, 10)) // Fork at (10,0)
  ];
  const stretches2 = RoadPath.detectStretches(segs2);
  // Stretches are (0,0)->(10,0), (10,0)->(20,0)->(30,0), (10,0)->(10,10)
  assert('Detects 3 stretches from fork', stretches2.length === 3);

  // 3. Midpoint check
  const path = new RoadPath([new Vector2D(0, 0), new Vector2D(100, 0)]);
  assert('Midpoint calculation is correct', path.midpoint().equals(new Vector2D(50, 0)));

  return results;
};
