
import { Vector2D } from './Vector2D';
import { RoadNetwork } from './RoadNetwork';
import { Segment2D } from './Segment2D';
import { TestResult } from '../types';

export const runRoadNetworkTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  const segments: Segment2D[] = [];
  const p1 = new Vector2D(0, 0);
  const p2 = new Vector2D(100, 0);
  
  // Test 1: Basic Addition
  RoadNetwork.addSegmentSnapped(p1, p2, segments);
  assert('Basic segment addition', segments.length === 1);
  
  // Test 2: Snapping to existing vertex
  const pNearP2 = new Vector2D(102, 1); // within 8 threshold
  const p3 = new Vector2D(150, 50);
  RoadNetwork.addSegmentSnapped(pNearP2, p3, segments, 10);
  
  assert('Snaps to near vertex', segments.length === 2 && segments[1].p1.equals(p2));

  // Test 3: Deduplication after snapping
  const pNearP1 = new Vector2D(-1, -1);
  const pNearP2_v2 = new Vector2D(99, 0.5);
  RoadNetwork.addSegmentSnapped(pNearP1, pNearP2_v2, segments, 10);
  assert('Deduplicates after snapping', segments.length === 2);

  // Test 4: Zero-length rejection
  const pA = new Vector2D(200, 200);
  const pB = new Vector2D(201, 201); // will snap to each other if threshold > 1.5
  const localSegs: Segment2D[] = [];
  RoadNetwork.addSegmentSnapped(pA, pB, localSegs, 5);
  assert('Rejects segments that snap into zero length', localSegs.length === 0);

  // Test 5: Global Cleanup Logic
  const messyNetwork = [
    new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0)),
    new Segment2D(new Vector2D(10.5, 0.2), new Vector2D(20, 0)), // Should snap (10.5, 0.2) to (10, 0)
    new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0)),        // Duplicate
    new Segment2D(new Vector2D(50, 50), new Vector2D(50.1, 50.1)) // Degenerate (too close)
  ];
  const cleaned = RoadNetwork.cleanupNetwork(messyNetwork, 5);
  assert('Cleanup merges close vertices', cleaned.length === 2);
  assert('Cleanup removes duplicates', cleaned.length === 2);
  assert('Cleanup removes degenerate segments', !cleaned.some(s => s.p1.dist(s.p2) < 1));

  // Test 6: Intersection Splitting
  const cross1 = new Segment2D(new Vector2D(0, 50), new Vector2D(100, 50));
  const cross2 = new Segment2D(new Vector2D(50, 0), new Vector2D(50, 100));
  const splitNetwork = RoadNetwork.cleanupNetwork([cross1, cross2], 5);
  // Should split into 4 segments meeting at (50, 50)
  assert('Cleanup splits intersecting segments', splitNetwork.length === 4);
  const centersAt50 = splitNetwork.filter(s => s.p1.equals(new Vector2D(50, 50)) || s.p2.equals(new Vector2D(50, 50)));
  assert('Split segments share the intersection point', centersAt50.length === 4);

  return results;
};
