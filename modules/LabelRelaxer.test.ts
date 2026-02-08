import { Vector2D } from './Vector2D';
import { LabelRelaxer, Label } from './LabelRelaxer';
import { TestResult } from '../types';

export const runLabelRelaxerTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  // 1. Test Dimension Estimation
  const dims = LabelRelaxer.estimateDimensions("Test City", 1.0);
  assert('Dimensions estimation returns width/height', dims.width > 0 && dims.height > 0);
  assert('Width scales with text length', LabelRelaxer.estimateDimensions("A", 1).width < LabelRelaxer.estimateDimensions("Longer Name", 1).width);

  // 2. Test Separation of Overlapping Labels
  const anchor = new Vector2D(50, 50);
  const labels: Label[] = [
    { id: '1', anchor: anchor.copy(), pos: anchor.copy(), width: 20, height: 10 },
    { id: '2', anchor: anchor.copy(), pos: anchor.copy(), width: 20, height: 10 }
  ];

  const relaxed = LabelRelaxer.relax(labels, 50, 5);
  const dist = relaxed[0].pos.dist(relaxed[1].pos);
  
  assert('Identical anchors are pushed apart by relaxation', dist > 0);
  assert('Relaxed labels maintain a minimum separation distance', dist >= 5);

  // 3. Test Anchor Attraction (Stability)
  const farPos = new Vector2D(100, 100);
  const unstableLabel: Label[] = [
    { id: 'unstable', anchor: anchor.copy(), pos: farPos.copy(), width: 10, height: 10 }
  ];
  const stabilized = LabelRelaxer.relax(unstableLabel, 10, 0);
  assert('Isolated labels move toward their anchor point', stabilized[0].pos.dist(anchor) < farPos.dist(anchor));

  return results;
};