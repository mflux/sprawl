import { describe, it, expect } from 'vitest';
import { state, saveSettings } from '../state/store';
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

  it('can update and persist a setting value', () => {
    const original = state.settings.hubCount;
    state.settings.hubCount = 99;
    saveSettings(state.settings);
    expect(state.settings.hubCount).toBe(99);
    // Cleanup
    state.settings.hubCount = original;
    saveSettings(state.settings);
  });
});
