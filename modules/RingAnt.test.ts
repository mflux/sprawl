import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Ant } from './Ant';
import { Segment2D } from './Segment2D';
import { RoadNetwork } from './RoadNetwork';

describe('RingAnt', () => {
  const center = new Vector2D(500, 500);
  const radius = 100;
  const startPos = new Vector2D(600, 500);

  it('starts alive with tangent direction', () => {
    const ant = new Ant(startPos, center, {
      type: 'ring', ringCenter: center, ringRadius: radius, ringClockwise: true, speed: 2, trailDistance: 10,
    });
    expect(ant.isAlive).toBe(true);
    expect(ant.direction.y).toBeGreaterThan(0.9);
    expect(Math.abs(ant.direction.x)).toBeLessThan(0.1);
  });

  it('maintains orbit radius within 10% after 50 steps', () => {
    const ant = new Ant(startPos, center, {
      type: 'ring', ringCenter: center, ringRadius: radius, ringClockwise: true, speed: 2, trailDistance: 10,
    });
    for (let i = 0; i < 50; i++) ant.update();
    const dist = ant.position.dist(center);
    expect(Math.abs(dist - radius)).toBeLessThan(10);
  });

  it('moves significantly from start', () => {
    const ant = new Ant(startPos, center, {
      type: 'ring', ringCenter: center, ringRadius: radius, ringClockwise: true, speed: 2, trailDistance: 10,
    });
    for (let i = 0; i < 50; i++) ant.update();
    expect(ant.position.dist(startPos)).toBeGreaterThan(50);
  });

  it('emits trail segments into road network', () => {
    const roads: Segment2D[] = [];
    const ant = new Ant(startPos, center, {
      type: 'ring', ringCenter: center, ringRadius: radius, ringClockwise: true, speed: 5, trailDistance: 10,
    });
    let trailsEmitted = 0;
    for (let i = 0; i < 20; i++) {
      const result = ant.update();
      if (result === 'trail_left') {
        const seg = RoadNetwork.addSegmentSnapped(ant.lastTrailPos, ant.position, roads, 2);
        if (seg) trailsEmitted++;
        ant.commitTrail();
      }
    }
    expect(trailsEmitted).toBeGreaterThanOrEqual(5);
    expect(roads.length).toBeGreaterThan(0);
  });
});
