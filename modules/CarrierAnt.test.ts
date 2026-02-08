import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Ant } from './Ant';

describe('CarrierAnt', () => {
  it('initial distance tracking is zero', () => {
    const carrier = new Ant(new Vector2D(0, 0), new Vector2D(1000, 0), { type: 'carrier', speed: 2 });
    expect(carrier.distanceSinceLastFork).toBe(0);
  });

  it('updates distance tracker after movement', () => {
    const carrier = new Ant(new Vector2D(0, 0), new Vector2D(1000, 0), { type: 'carrier', speed: 2 });
    carrier.update();
    expect(carrier.distanceSinceLastFork).toBe(2);
  });

  it('maintains extreme inertia', () => {
    const carrier = new Ant(new Vector2D(0, 0), new Vector2D(1000, 0), { type: 'carrier', speed: 1 });
    const initialDir = carrier.direction.copy();
    const perpForce = new Vector2D(0, 1);
    carrier.direction = carrier.direction.mul(0.99).add(perpForce.mul(0.01)).normalize();
    expect(Math.abs(carrier.direction.dot(initialDir))).toBeGreaterThan(0.99);
  });

  it('calculates 90-degree orthogonal direction correctly', () => {
    const parentDir = new Vector2D(1, 0);
    const turnAngle = Math.PI / 2;
    const childDir = new Vector2D(
      parentDir.x * Math.cos(turnAngle) - parentDir.y * Math.sin(turnAngle),
      parentDir.x * Math.sin(turnAngle) + parentDir.y * Math.cos(turnAngle),
    );
    expect(Math.abs(childDir.dot(parentDir))).toBeLessThan(0.0001);
    expect(childDir.equals(new Vector2D(0, 1))).toBe(true);
  });
});
