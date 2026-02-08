import { describe, it, expect } from 'vitest';
import { state } from '../state/engine';
import { useUIStore } from '../state/uiStore';
import { SimulationSettings } from '../types';

describe('Settings', () => {
  const requiredKeys: (keyof SimulationSettings)[] = [
    'antTurnSpeed', 'hubInfluence', 'hubCount', 'antMaxLife', 'antTrailDistance',
    'antWanderIntensity', 'antSubdivideWander', 'antSnapDistance', 'antSubdivideSnap', 'flowFieldInfluence',
  ];

  it.each(requiredKeys)('settings contains numeric key: %s', (key) => {
    expect(typeof state.settings[key]).toBe('number');
  });

  it('hubCount is at least 2', () => {
    expect(state.settings.hubCount).toBeGreaterThanOrEqual(2);
  });

  it('antMaxLife is positive', () => {
    expect(state.settings.antMaxLife).toBeGreaterThan(0);
  });

  it('can update a setting value via Zustand store', () => {
    const original = useUIStore.getState().settings.hubCount;
    useUIStore.getState().updateSetting('hubCount', 99);
    expect(useUIStore.getState().settings.hubCount).toBe(99);
    // Cleanup
    useUIStore.getState().updateSetting('hubCount', original);
  });
});
