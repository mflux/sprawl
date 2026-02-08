import { describe, it, expect } from 'vitest';
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { ElevationMap } from './ElevationMap';
import { TerrainCulling } from './TerrainCulling';

describe('TerrainCulling', () => {
  const mockElevation = {
    getHeight: (x: number, _y: number) => (x < 50 ? 0.8 : 0.1),
  } as ElevationMap;
  const waterLevel = 0.5;

  const segLand = new Segment2D(new Vector2D(10, 10), new Vector2D(40, 10));
  const segWater = new Segment2D(new Vector2D(60, 10), new Vector2D(90, 10));
  const segBridge = new Segment2D(new Vector2D(40, 20), new Vector2D(60, 20));

  it('keeps segment fully on land', () => {
    const output = TerrainCulling.cullSegments([segLand, segWater, segBridge], mockElevation, waterLevel);
    expect(output).toContain(segLand);
  });

  it('removes segment fully in water', () => {
    const output = TerrainCulling.cullSegments([segLand, segWater, segBridge], mockElevation, waterLevel);
    expect(output).not.toContain(segWater);
  });

  it('removes segment crossing through water', () => {
    const output = TerrainCulling.cullSegments([segLand, segWater, segBridge], mockElevation, waterLevel);
    expect(output).not.toContain(segBridge);
  });

  it('output count is correct', () => {
    const output = TerrainCulling.cullSegments([segLand, segWater, segBridge], mockElevation, waterLevel);
    expect(output).toHaveLength(1);
  });
});
