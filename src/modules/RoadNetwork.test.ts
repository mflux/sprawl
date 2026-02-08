import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { RoadNetwork } from './RoadNetwork';
import { Segment2D } from './Segment2D';

describe('RoadNetwork', () => {
  it('adds a basic segment', () => {
    const segments: Segment2D[] = [];
    RoadNetwork.addSegmentSnapped(new Vector2D(0, 0), new Vector2D(100, 0), segments);
    expect(segments).toHaveLength(1);
  });

  it('snaps to an existing nearby vertex', () => {
    const segments: Segment2D[] = [];
    const p2 = new Vector2D(100, 0);
    RoadNetwork.addSegmentSnapped(new Vector2D(0, 0), p2, segments);
    RoadNetwork.addSegmentSnapped(new Vector2D(102, 1), new Vector2D(150, 50), segments, 10);
    expect(segments).toHaveLength(2);
    expect(segments[1].p1.equals(p2)).toBe(true);
  });

  it('deduplicates after snapping', () => {
    const segments: Segment2D[] = [];
    RoadNetwork.addSegmentSnapped(new Vector2D(0, 0), new Vector2D(100, 0), segments);
    RoadNetwork.addSegmentSnapped(new Vector2D(-1, -1), new Vector2D(99, 0.5), segments, 10);
    expect(segments).toHaveLength(1);
  });

  it('rejects segments that snap into zero length', () => {
    const segments: Segment2D[] = [];
    RoadNetwork.addSegmentSnapped(new Vector2D(200, 200), new Vector2D(201, 201), segments, 5);
    expect(segments).toHaveLength(0);
  });

  it('cleans up messy networks', () => {
    const messy = [
      new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0)),
      new Segment2D(new Vector2D(10.5, 0.2), new Vector2D(20, 0)),
      new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0)),
      new Segment2D(new Vector2D(50, 50), new Vector2D(50.1, 50.1)),
    ];
    const cleaned = RoadNetwork.cleanupNetwork(messy, 5);
    expect(cleaned).toHaveLength(2);
    expect(cleaned.every(s => s.p1.dist(s.p2) >= 1)).toBe(true);
  });

  it('splits intersecting segments at intersection point', () => {
    const cross1 = new Segment2D(new Vector2D(0, 50), new Vector2D(100, 50));
    const cross2 = new Segment2D(new Vector2D(50, 0), new Vector2D(50, 100));
    const split = RoadNetwork.cleanupNetwork([cross1, cross2], 5);
    expect(split).toHaveLength(4);
    const touchCenter = split.filter(
      s => s.p1.equals(new Vector2D(50, 50)) || s.p2.equals(new Vector2D(50, 50))
    );
    expect(touchCenter).toHaveLength(4);
  });
});
