
import { Vector2D } from './Vector2D';
import { Ant } from './Ant';
import { Segment2D } from './Segment2D';
import { RoadNetwork } from './RoadNetwork';
import { TestResult } from '../types';

export const runRingAntTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  const center = new Vector2D(500, 500);
  const radius = 100;
  const startPos = new Vector2D(600, 500); // On the right side of center
  
  // 1. Creation and Initial Direction
  const ant = new Ant(startPos, center, {
    type: 'ring',
    ringCenter: center,
    ringRadius: radius,
    ringClockwise: true,
    speed: 2,
    trailDistance: 10
  });

  assert('Ring ant starts alive', ant.isAlive);
  // Tangent to (1,0) at (600,500) clockwise is (0,1)
  assert('Ring ant initial direction is tangent', ant.direction.y > 0.9 && Math.abs(ant.direction.x) < 0.1);

  // 2. Movement and Orbit Stability
  // Run for 50 steps
  for (let i = 0; i < 50; i++) {
    ant.update();
  }
  
  const dist = ant.position.dist(center);
  assert('Ring ant maintains orbit radius within 10%', Math.abs(dist - radius) < 10, `Radius deviated to ${dist.toFixed(2)}`);
  assert('Ring ant moved significantly', ant.position.dist(startPos) > 50);

  // 3. Trail Generation Integration
  const roads: Segment2D[] = [];
  const testAnt = new Ant(startPos, center, {
    type: 'ring',
    ringCenter: center,
    ringRadius: radius,
    ringClockwise: true,
    speed: 5,
    trailDistance: 10 // Should trigger every 2 steps
  });

  let trailsEmitted = 0;
  for (let i = 0; i < 20; i++) {
    const oldPos = testAnt.position.copy();
    const result = testAnt.update();
    if (result === 'trail_left') {
      const seg = RoadNetwork.addSegmentSnapped(testAnt.lastTrailPos, testAnt.position, roads, 2);
      if (seg) trailsEmitted++;
      testAnt.commitTrail();
    }
  }

  assert('Ring ant emitted at least 5 trails', trailsEmitted >= 5, `Only emitted ${trailsEmitted} trails`);
  assert('Road network has segments from ring ant', roads.length > 0);

  return results;
};
