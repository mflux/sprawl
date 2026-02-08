import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { SpatialGrid } from './SpatialGrid';

interface PointItem { id: string; pos: Vector2D }
const getPos = (i: PointItem) => i.pos;

describe('SpatialGrid', () => {
  it('retrieves item within radius', () => {
    const grid = new SpatialGrid<PointItem>(50);
    const p = { id: 'a', pos: new Vector2D(10, 10) };
    grid.insert(p.pos, p);
    const found = grid.query(new Vector2D(12, 12), 5, getPos);
    expect(found).toHaveLength(1);
    expect(found[0].id).toBe('a');
  });

  it('filters out distant items', () => {
    const grid = new SpatialGrid<PointItem>(50);
    grid.insert(new Vector2D(10, 10), { id: 'a', pos: new Vector2D(10, 10) });
    grid.insert(new Vector2D(100, 100), { id: 'b', pos: new Vector2D(100, 100) });
    const found = grid.query(new Vector2D(10, 10), 10, getPos);
    expect(found).toHaveLength(1);
    expect(found[0].id).toBe('a');
  });

  it('spans multiple cells correctly', () => {
    const grid = new SpatialGrid<PointItem>(50);
    grid.insert(new Vector2D(10, 10), { id: 'a', pos: new Vector2D(10, 10) });
    grid.insert(new Vector2D(60, 60), { id: 'c', pos: new Vector2D(60, 60) });
    const found = grid.query(new Vector2D(35, 35), 40, getPos);
    expect(found).toHaveLength(2);
  });

  it('clears all items', () => {
    const grid = new SpatialGrid<PointItem>(50);
    grid.insert(new Vector2D(10, 10), { id: 'a', pos: new Vector2D(10, 10) });
    grid.clear();
    expect(grid.query(new Vector2D(10, 10), 100, getPos)).toHaveLength(0);
  });
});
