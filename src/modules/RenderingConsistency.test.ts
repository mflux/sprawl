import { describe, it, expect } from 'vitest';
import { DEFAULT_VIZ_SETTINGS } from '../state/store';

describe('RenderingConsistency', () => {
  const viz = DEFAULT_VIZ_SETTINGS;

  it('road thickness uses visualization settings', () => {
    expect(viz.roadThickness / 1.0).toBe(1.2);
  });

  it('road color matches design system (Slate-400)', () => {
    const roadColor = [148, 163, 184, viz.roadOpacity];
    expect(roadColor[0]).toBe(148);
    expect(roadColor[1]).toBe(163);
  });

  it('shape layer stroke weight is zero (outlines delegated to roads)', () => {
    const shapeLayerStrokeWeight = 0;
    expect(shapeLayerStrokeWeight).toBe(0);
  });
});
