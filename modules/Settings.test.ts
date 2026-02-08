
import { state, saveSettings } from '../state/store';
import { TestResult, SimulationSettings } from '../types';

export const runSettingsTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  const assert = (name: string, condition: boolean, errorMsg?: string) => {
    results.push({
      name,
      passed: condition,
      error: condition ? undefined : (errorMsg || 'Assertion failed')
    });
  };

  const requiredKeys: (keyof SimulationSettings)[] = [
    'antTurnSpeed',
    'hubInfluence',
    'hubCount',
    'antMaxLife',
    'antTrailDistance',
    'antWanderIntensity',
    'antSubdivideWander',
    'antSnapDistance',
    'antSubdivideSnap',
    'flowFieldInfluence'
  ];

  // Test 1: Presence of all 10 keys
  const currentSettings = state.settings;
  requiredKeys.forEach(key => {
    assert(`Settings contains ${key}`, typeof currentSettings[key] === 'number', `Key ${key} is missing or not a number`);
  });

  // Test 2: Validation of specific defaults (just to be sure)
  assert('hubCount is at least 2', currentSettings.hubCount >= 2);
  assert('antMaxLife is positive', currentSettings.antMaxLife > 0);

  // Test 3: Save/Load interface (mocking localStorage indirectly by testing state mutation)
  const originalVal = currentSettings.hubCount;
  const testVal = 99;
  currentSettings.hubCount = testVal;
  saveSettings(currentSettings);
  assert('Can update setting value in state', state.settings.hubCount === testVal);
  
  // Cleanup
  state.settings.hubCount = originalVal;
  saveSettings(state.settings);

  return results;
};
