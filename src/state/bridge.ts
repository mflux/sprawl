/**
 * Bridge — wires up the Zustand UI store ↔ Engine settings sync
 * and subscribes the UI store to engine notifications.
 *
 * Import this module once at app startup (e.g. in App.tsx).
 */

import { useUIStore } from './uiStore';
import engine from './engine';

// 1. Sync initial settings from Zustand → Engine
engine.syncSettings(useUIStore.getState().settings);
engine.syncVizSettings(useUIStore.getState().vizSettings);

// 2. When Zustand settings change → push into engine
let prevSettings = useUIStore.getState().settings;
let prevVizSettings = useUIStore.getState().vizSettings;

useUIStore.subscribe((state) => {
  if (state.settings !== prevSettings) {
    prevSettings = state.settings;
    engine.syncSettings(state.settings);
  }
  if (state.vizSettings !== prevVizSettings) {
    prevVizSettings = state.vizSettings;
    engine.syncVizSettings(state.vizSettings);
  }
});

// 3. When engine notifies → bump tick so React re-renders
engine.subscribe(() => {
  useUIStore.getState().bumpTick();
});
