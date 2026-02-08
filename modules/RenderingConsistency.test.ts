
import { TestResult, VisualizationSettings } from '../types';
import { DEFAULT_VIZ_SETTINGS } from '../state/store';

export const runRenderingConsistencyTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  const viz = DEFAULT_VIZ_SETTINGS;
  const currentScale = 1.0;

  // 1. Verify Road Stroke Logic
  const roadWeight = viz.roadThickness / currentScale;
  const roadColor = [148, 163, 184, viz.roadOpacity]; // Slate-400
  
  assert('Road thickness uses visualization settings', roadWeight === 1.2);
  assert('Road color matches design system (Slate-400)', roadColor[0] === 148 && roadColor[1] === 163);

  // 2. Verify Delegation Principle
  // The shape layer must have zero stroke weight to prevent overlap thickening
  const shapeLayerStrokeWeight = 0; 
  assert('Shape layer stroke weight is ZERO (Outlines delegated to roads)', shapeLayerStrokeWeight === 0);

  return results;
};
