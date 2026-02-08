import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { Segment2D } from './Segment2D';
import { TransposeGrid } from './TransposeGrid';

describe('TransposeGrid', () => {
  const center = new Vector2D(0, 0);

  it('generates correct number of grid segments', () => {
    const grid = TransposeGrid.generateRawGrid(center, 100, 100, 20, 20);
    expect(grid).toHaveLength(60);
  });

  it('warping moves vertices from original positions', () => {
    const mesh = TransposeGrid.generateMesh(center, 100, 100, 20, 20);
    const warped = TransposeGrid.warpMesh(mesh, 50);
    let moved = false;
    for (let x = 0; x < mesh.length && !moved; x++) {
      for (let y = 0; y < mesh[x].length && !moved; y++) {
        if (!mesh[x][y].equals(warped[x][y])) moved = true;
      }
    }
    expect(moved).toBe(true);
  });

  it('relaxation reduces total mesh length', () => {
    const mesh = TransposeGrid.generateMesh(center, 100, 100, 20, 20);
    const messy = TransposeGrid.warpMesh(mesh, 20);
    const relaxed = TransposeGrid.relaxMesh(messy, 5);
    const len = (m: Vector2D[][]) => TransposeGrid.meshToSegments(m).reduce((sum, s) => sum + s.length(), 0);
    expect(len(relaxed)).toBeLessThan(len(messy));
  });

  it('clips grid to shape interior', () => {
    const square = new Shape2D([
      new Vector2D(-50, -50), new Vector2D(50, -50), new Vector2D(50, 50), new Vector2D(-50, 50),
    ]);
    const oversized = TransposeGrid.generateRawGrid(center, 200, 200, 50, 50);
    const clipped = TransposeGrid.clipGridToShape(oversized, square);
    expect(clipped.length).toBeGreaterThan(0);
    const allInside = clipped.every(s =>
      square.containsPoint(s.midpoint()) || square.containsPoint(s.p1.add(s.p2.sub(s.p1).mul(0.1)))
    );
    expect(allInside).toBe(true);
  });

  it('snaps near-vertex intersections to shape vertices', () => {
    const triangle = new Shape2D([
      new Vector2D(0, 0), new Vector2D(100, 0), new Vector2D(50, 100),
    ]);
    const line = new Segment2D(new Vector2D(49.5, -50), new Vector2D(49.5, 150));
    const withSnap = TransposeGrid.clipGridToShape([line], triangle, 5);
    const topPoint = withSnap.find(s => s.p1.y > 90 || s.p2.y > 90);
    const snapped = topPoint && (
      topPoint.p1.equals(new Vector2D(50, 100)) || topPoint.p2.equals(new Vector2D(50, 100))
    );
    expect(snapped).toBe(true);
  });
});
