import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { ShapeSpatialGrid } from './ShapeSpatialGrid';

describe('ShapeSpatialGrid', () => {
  it('returns correct candidate for nearby query', () => {
    const grid = new ShapeSpatialGrid(100);
    const shapeA = new Shape2D([new Vector2D(10, 10), new Vector2D(60, 10), new Vector2D(60, 60), new Vector2D(10, 60)]);
    const shapeB = new Shape2D([new Vector2D(210, 210), new Vector2D(260, 210), new Vector2D(260, 260), new Vector2D(210, 260)]);
    grid.insert(shapeA);
    grid.insert(shapeB);
    const candidates = grid.queryCandidates(new Vector2D(20, 20));
    expect(candidates).toContain(shapeA);
    expect(candidates).not.toContain(shapeB);
  });

  it('indexes large shape in multiple cells', () => {
    const grid = new ShapeSpatialGrid(100);
    const shapeC = new Shape2D([new Vector2D(80, 80), new Vector2D(120, 80), new Vector2D(120, 120), new Vector2D(80, 120)]);
    grid.insert(shapeC);
    expect(grid.queryCandidates(new Vector2D(50, 50))).toContain(shapeC);
    expect(grid.queryCandidates(new Vector2D(150, 150))).toContain(shapeC);
  });

  it('findShapeAt correctly identifies containing shape', () => {
    const grid = new ShapeSpatialGrid(100);
    const shape = new Shape2D([new Vector2D(10, 10), new Vector2D(60, 10), new Vector2D(60, 60), new Vector2D(10, 60)]);
    grid.insert(shape);
    expect(grid.findShapeAt(new Vector2D(30, 30))).toBe(shape);
  });

  it('findShapeAt returns null for empty areas', () => {
    const grid = new ShapeSpatialGrid(100);
    const shape = new Shape2D([new Vector2D(10, 10), new Vector2D(60, 10), new Vector2D(60, 60), new Vector2D(10, 60)]);
    grid.insert(shape);
    expect(grid.findShapeAt(new Vector2D(150, 50))).toBeNull();
  });
});
