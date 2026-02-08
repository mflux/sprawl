
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { Pathfinder } from './Pathfinder';
import { ElevationMap } from './ElevationMap';
import { TestResult } from '../types';

export const runPathfinderTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  // Setup simple grid: 
  // (0,0) -- (10,0) -- (20,0)
  //   |        |        |
  // (0,10) - (10,10) - (20,10)
  const segments = [
    new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0)),
    new Segment2D(new Vector2D(10, 0), new Vector2D(20, 0)),
    new Segment2D(new Vector2D(0, 0), new Vector2D(0, 10)),
    new Segment2D(new Vector2D(10, 0), new Vector2D(10, 10)),
    new Segment2D(new Vector2D(20, 0), new Vector2D(20, 10)),
    new Segment2D(new Vector2D(0, 10), new Vector2D(10, 10)),
    new Segment2D(new Vector2D(10, 10), new Vector2D(20, 10)),
  ];

  // Test 1: Simple Path
  const path1 = Pathfinder.findPath(new Vector2D(0, 0), new Vector2D(20, 10), segments);
  assert('Finds a valid path in a simple grid', !!path1 && path1.length >= 3);
  assert('Path starts at start node', !!path1 && path1[0].equals(new Vector2D(0, 0)));
  assert('Path ends at end node', !!path1 && path1[path1.length - 1].equals(new Vector2D(20, 10)));

  // Test 2: Dead end
  const deadEndSegments = [
    new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0)),
    new Segment2D(new Vector2D(50, 50), new Vector2D(60, 50))
  ];
  const path2 = Pathfinder.findPath(new Vector2D(0, 0), new Vector2D(60, 50), deadEndSegments);
  assert('Returns null when no path exists', path2 === null);

  // Test 3: Terrain Awareness
  // Path A: (0,0) -> (10,0) -> (20,0) [Flat]
  // Path B: (0,0) -> (10,5) -> (20,0) [Hill at (10,5)]
  const hillSegments = [
    new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0)),
    new Segment2D(new Vector2D(10, 0), new Vector2D(20, 0)),
    new Segment2D(new Vector2D(0, 0), new Vector2D(10, 5)),
    new Segment2D(new Vector2D(10, 5), new Vector2D(20, 0))
  ];
  
  // Mock elevation: point (10, 5) is high, others are low
  const mockElevation = {
    getHeight: (x: number, y: number) => (x === 10 && y === 5) ? 1.0 : 0.0
  } as ElevationMap;

  const pathWithHill = Pathfinder.findPath(new Vector2D(0, 0), new Vector2D(20, 0), hillSegments, mockElevation);
  // It should prefer the flat path (0,0)->(10,0)->(20,0) over climbing the hill at (10,5)
  assert('Terrain awareness prefers flat paths over hills', 
    !!pathWithHill && pathWithHill.some(p => p.y === 0) && !pathWithHill.some(p => p.y === 5)
  );

  return results;
};
