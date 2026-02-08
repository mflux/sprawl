import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { ShapeDetector } from './ShapeDetector';

describe('ShapeDetector', () => {
  it('detects 1 shape in triangle with overhang', () => {
    const p1 = new Vector2D(0, 0);
    const p2 = new Vector2D(50, 0);
    const p3 = new Vector2D(25, 50);
    const segments = [
      new Segment2D(p1, p2),
      new Segment2D(p2, p3),
      new Segment2D(p3, p1),
      new Segment2D(p2, new Vector2D(70, 0)), // overhang
    ];
    expect(ShapeDetector.detectShapes(segments)).toHaveLength(1);
  });

  it('detects 1 shape in simple square', () => {
    const segments = [
      new Segment2D(new Vector2D(100, 100), new Vector2D(200, 100)),
      new Segment2D(new Vector2D(200, 100), new Vector2D(200, 200)),
      new Segment2D(new Vector2D(200, 200), new Vector2D(100, 200)),
      new Segment2D(new Vector2D(100, 200), new Vector2D(100, 100)),
    ];
    expect(ShapeDetector.detectShapes(segments)).toHaveLength(1);
  });

  it('detects 2 shapes in adjacent squares', () => {
    const segments = [
      new Segment2D(new Vector2D(0, 0), new Vector2D(10, 0)),
      new Segment2D(new Vector2D(10, 0), new Vector2D(10, 10)),
      new Segment2D(new Vector2D(10, 10), new Vector2D(0, 10)),
      new Segment2D(new Vector2D(0, 10), new Vector2D(0, 0)),
      new Segment2D(new Vector2D(10, 0), new Vector2D(20, 0)),
      new Segment2D(new Vector2D(20, 0), new Vector2D(20, 10)),
      new Segment2D(new Vector2D(20, 10), new Vector2D(10, 10)),
    ];
    expect(ShapeDetector.detectShapes(segments)).toHaveLength(2);
  });
});
