import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { ArterialDetector } from './ArterialDetector';

describe('ArterialDetector', () => {
  it('splits a square into 4 arterials', () => {
    const square = new Shape2D([
      new Vector2D(0, 0), new Vector2D(100, 0), new Vector2D(100, 100), new Vector2D(0, 100),
    ]);
    expect(ArterialDetector.detectArterialsFromShapes([square], 50)).toHaveLength(4);
  });

  it('handles angular wrap-around near 0-degree axis', () => {
    const shape = new Shape2D([
      new Vector2D(0, 0), new Vector2D(50, -2), new Vector2D(100, 0),
      new Vector2D(150, 2), new Vector2D(200, 0), new Vector2D(200, 100), new Vector2D(0, 100),
    ]);
    const arts = ArterialDetector.detectArterialsFromShapes([shape], 45);
    expect(arts.some(a => a.points.length >= 5)).toBe(true);
  });

  it('splits teardrop into 3 arterials', () => {
    const shape = new Shape2D([
      new Vector2D(372.6, 115.4), new Vector2D(470.0, 239.9), new Vector2D(501.5, 366.9),
      new Vector2D(412.7, 456.0), new Vector2D(259.4, 494.0), new Vector2D(173.5, 418.0),
      new Vector2D(169.2, 279.2), new Vector2D(269.4, 171.8),
    ]);
    expect(ArterialDetector.detectArterialsFromShapes([shape], 50)).toHaveLength(3);
  });

  it('is robust against near-duplicate vertices', () => {
    const shape = new Shape2D([
      new Vector2D(0, 0), new Vector2D(100, 0), new Vector2D(100, 0.0001),
      new Vector2D(100, 100), new Vector2D(0, 100),
    ]);
    expect(ArterialDetector.detectArterialsFromShapes([shape], 50)).toHaveLength(4);
  });
});
