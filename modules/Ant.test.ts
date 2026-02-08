import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Ant } from './Ant';

describe('Ant', () => {
  it('dies after life expires', () => {
    const ant = new Ant(new Vector2D(0, 0), new Vector2D(100, 0), { speed: 10, life: 5 });
    for (let i = 0; i < 5; i++) ant.update();
    expect(ant.isAlive).toBe(false);
  });

  it('dies when reaching target radius', () => {
    const ant = new Ant(new Vector2D(98, 0), new Vector2D(100, 0), { speed: 5 });
    ant.update();
    expect(ant.isAlive).toBe(false);
  });

  it('steers towards target', () => {
    const ant = new Ant(new Vector2D(0, 0), new Vector2D(100, 0), { speed: 1, turnSpeed: 0.1 });
    ant.direction = new Vector2D(0, -1);
    const initialX = ant.direction.x;
    ant.update();
    expect(ant.direction.x).toBeGreaterThan(initialX);
  });

  it('detects head-on collision', () => {
    const a = new Ant(new Vector2D(0, 0), new Vector2D(100, 0));
    a.direction = new Vector2D(1, 0);
    const b = new Ant(new Vector2D(5, 0), new Vector2D(-100, 0));
    b.direction = new Vector2D(-1, 0);
    expect(Ant.checkCollision(a, b)).toBe(true);
  });

  it('does not collide when moving in same direction', () => {
    const a = new Ant(new Vector2D(0, 0), new Vector2D(100, 0));
    a.direction = new Vector2D(1, 0);
    const b = new Ant(new Vector2D(5, 0), new Vector2D(105, 0));
    b.direction = new Vector2D(1, 0);
    expect(Ant.checkCollision(a, b)).toBe(false);
  });
});
