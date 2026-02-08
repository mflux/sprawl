import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { LabelRelaxer, Label } from './LabelRelaxer';

describe('LabelRelaxer', () => {
  it('estimates dimensions with positive width and height', () => {
    const dims = LabelRelaxer.estimateDimensions('Test City', 1.0);
    expect(dims.width).toBeGreaterThan(0);
    expect(dims.height).toBeGreaterThan(0);
  });

  it('width scales with text length', () => {
    const short = LabelRelaxer.estimateDimensions('A', 1);
    const long = LabelRelaxer.estimateDimensions('Longer Name', 1);
    expect(long.width).toBeGreaterThan(short.width);
  });

  it('pushes overlapping labels apart', () => {
    const anchor = new Vector2D(50, 50);
    const labels: Label[] = [
      { id: '1', anchor: anchor.copy(), pos: anchor.copy(), width: 20, height: 10 },
      { id: '2', anchor: anchor.copy(), pos: anchor.copy(), width: 20, height: 10 },
    ];
    const relaxed = LabelRelaxer.relax(labels, 50, 5);
    expect(relaxed[0].pos.dist(relaxed[1].pos)).toBeGreaterThanOrEqual(5);
  });

  it('isolated labels move toward their anchor', () => {
    const anchor = new Vector2D(50, 50);
    const farPos = new Vector2D(100, 100);
    const labels: Label[] = [
      { id: 'unstable', anchor: anchor.copy(), pos: farPos.copy(), width: 10, height: 10 },
    ];
    const stabilized = LabelRelaxer.relax(labels, 10, 0);
    expect(stabilized[0].pos.dist(anchor)).toBeLessThan(farPos.dist(anchor));
  });
});
