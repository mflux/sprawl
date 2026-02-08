import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Ant } from './Ant';

describe('BridgeAnt', () => {
  it('does not die in water', () => {
    const ant = new Ant(new Vector2D(0, 0), new Vector2D(200, 0), { type: 'bridge', speed: 2 });
    const mockFlowField: any = {
      elevation: { getHeight: () => 0.1 },
      waterLevel: 0.5,
      getVectorAt: () => new Vector2D(0, 1),
    };
    const result = ant.update(mockFlowField, 1.0);
    expect(result).not.toBe('death_water');
    expect(ant.isAlive).toBe(true);
  });

  it('ignores environmental steering forces', () => {
    const ant = new Ant(new Vector2D(0, 0), new Vector2D(200, 0), { type: 'bridge', speed: 2 });
    const mockFlowField: any = {
      elevation: { getHeight: () => 0.1 },
      waterLevel: 0.5,
      getVectorAt: () => new Vector2D(0, 1),
    };
    ant.update(mockFlowField, 1.0);
    const initialDir = ant.direction.copy();
    expect(Math.abs(ant.direction.dot(initialDir))).toBeGreaterThan(0.99);
  });

  it('stops when reaching target', () => {
    const ant = new Ant(new Vector2D(0, 0), new Vector2D(200, 0), { type: 'bridge', speed: 2 });
    ant.position = new Vector2D(199, 0);
    const result = ant.update();
    expect(result).toBe('target_reached');
  });
});
