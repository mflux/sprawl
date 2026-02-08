import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { Pathfinder } from './Pathfinder';
import { ElevationMap } from './ElevationMap';

describe('Pathfinder', () => {
  const grid = [
    new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0)),
    new Segment2D(new Vector2D(10, 0), new Vector2D(20, 0)),
    new Segment2D(new Vector2D(0, 0), new Vector2D(0, 10)),
    new Segment2D(new Vector2D(10, 0), new Vector2D(10, 10)),
    new Segment2D(new Vector2D(20, 0), new Vector2D(20, 10)),
    new Segment2D(new Vector2D(0, 10), new Vector2D(10, 10)),
    new Segment2D(new Vector2D(10, 10), new Vector2D(20, 10)),
  ];

  it('finds a valid path in a simple grid', () => {
    const path = Pathfinder.findPath(new Vector2D(0, 0), new Vector2D(20, 10), grid);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThanOrEqual(3);
  });

  it('path starts at start node', () => {
    const path = Pathfinder.findPath(new Vector2D(0, 0), new Vector2D(20, 10), grid);
    expect(path![0].equals(new Vector2D(0, 0))).toBe(true);
  });

  it('path ends at end node', () => {
    const path = Pathfinder.findPath(new Vector2D(0, 0), new Vector2D(20, 10), grid);
    expect(path![path!.length - 1].equals(new Vector2D(20, 10))).toBe(true);
  });

  it('returns null when no path exists', () => {
    const disconnected = [
      new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0)),
      new Segment2D(new Vector2D(50, 50), new Vector2D(60, 50)),
    ];
    expect(Pathfinder.findPath(new Vector2D(0, 0), new Vector2D(60, 50), disconnected)).toBeNull();
  });

  it('prefers flat paths over hills with terrain awareness', () => {
    const hillSegs = [
      new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0)),
      new Segment2D(new Vector2D(10, 0), new Vector2D(20, 0)),
      new Segment2D(new Vector2D(0, 0), new Vector2D(10, 5)),
      new Segment2D(new Vector2D(10, 5), new Vector2D(20, 0)),
    ];
    const mockElev = {
      getHeight: (x: number, y: number) => (x === 10 && y === 5 ? 1.0 : 0.0),
    } as ElevationMap;
    const path = Pathfinder.findPath(new Vector2D(0, 0), new Vector2D(20, 0), hillSegs, mockElev);
    expect(path).not.toBeNull();
    expect(path!.some(p => p.y === 0)).toBe(true);
    expect(path!.some(p => p.y === 5)).toBe(false);
  });
});
