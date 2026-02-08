
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { ArterialDetector } from './ArterialDetector';
import { TestResult } from '../types';

export const runArterialTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  // 1. Basic Square Check
  const square = new Shape2D([
    new Vector2D(0, 0),
    new Vector2D(100, 0),
    new Vector2D(100, 100),
    new Vector2D(0, 100)
  ]);
  const artsSquare = ArterialDetector.detectArterialsFromShapes([square], 50);
  assert('Square splits into 4 arterials', artsSquare.length === 4);

  // 2. Angular Wrap-Around (The 0/360 boundary)
  const wrappingPts = [
    new Vector2D(0, 0),
    new Vector2D(50, -2), 
    new Vector2D(100, 0),
    new Vector2D(150, 2),  
    new Vector2D(200, 0),
    new Vector2D(200, 100),
    new Vector2D(0, 100)
  ];
  const wrappingShape = new Shape2D(wrappingPts);
  const artsWrapping = ArterialDetector.detectArterialsFromShapes([wrappingShape], 45);
  assert('Handles turns near 0-degree axis', artsWrapping.some(a => a.points.length >= 5));

  // 3. User Teardrop (3-way split)
  // Points provided: P0(80.6°), P2(58.8°), P4(55.4°) are > 50°. 
  // P5(46.7°), P6(18.4°) etc are < 50°.
  const userTeardropPoints = [
    new Vector2D(372.6, 115.4),
    new Vector2D(470.0, 239.9),
    new Vector2D(501.5, 366.9),
    new Vector2D(412.7, 456.0),
    new Vector2D(259.4, 494.0),
    new Vector2D(173.5, 418.0),
    new Vector2D(169.2, 279.2),
    new Vector2D(269.4, 171.8)
  ];
  const tearShape = new Shape2D(userTeardropPoints);
  const artsTear = ArterialDetector.detectArterialsFromShapes([tearShape], 50);
  
  assert('Teardrop splits into 3 arterials', artsTear.length === 3, `Expected 3 segments, found ${artsTear.length}`);

  // 4. Dirty Data Robustness
  const dirtyShape = new Shape2D([
    new Vector2D(0, 0),
    new Vector2D(100, 0),
    new Vector2D(100, 0.0001), 
    new Vector2D(100, 100),
    new Vector2D(0, 100)
  ]);
  const artsDirty = ArterialDetector.detectArterialsFromShapes([dirtyShape], 50);
  assert('Robust against near-duplicate vertices', artsDirty.length === 4);

  return results;
};
