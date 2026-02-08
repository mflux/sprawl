import { describe, it, expect } from 'vitest';
import { ElevationMap } from './ElevationMap';
import { TerrainFlowField } from './TerrainFlowField';

describe('TerrainFlowField', () => {
  const mockElevation = {
    getHeight: (x: number, _y: number) => (x + 100) / 20,
    getCategory: (h: number) => (h < 0.3 ? 'water' : 'land'),
    getColor: () => '#000',
  } as unknown as ElevationMap;

  const tff = new TerrainFlowField(mockElevation, 0.3, 200, 200, 10, -100, -100);

  it('on land, flow is biased downhill', () => {
    const v = tff.getVectorAt(50, 0);
    expect(v.x).toBeLessThan(0);
  });

  it('in water, flow seeks higher ground', () => {
    const v = tff.getVectorAt(-95, 0);
    expect(v.x).toBeGreaterThan(0);
  });

  it('land vectors are normalized', () => {
    const v = tff.getVectorAt(50, 0);
    expect(Math.abs(v.mag() - 1)).toBeLessThan(0.01);
  });

  it('water vectors are normalized', () => {
    const v = tff.getVectorAt(-95, 0);
    expect(Math.abs(v.mag() - 1)).toBeLessThan(0.01);
  });
});
