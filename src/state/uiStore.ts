import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SimulationSettings, VisualizationSettings } from '../types';

// ── Defaults ──────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: SimulationSettings = {
  simSpeed: 12,
  hubCount: 12,
  antsPerHub: 2,
  spawnIntensity: 0.2,
  hubInfluence: 0.05,
  hubDirectness: 0.15,
  antTurnSpeed: 0.001,
  antWaves: 8,
  bridgeProbability: 0.85,
  maxBridgeLength: 600,
  antMaxLife: 1000,
  antTrailDistance: 6,
  antWanderIntensity: 0.01,
  antRoadSurvivalChance: 0.3,
  minLongRoadLength: 40,
  antParallelRepulsion: 0.35,
  minParallelDist: 45,
  antAttractionRadius: 50,
  antAttractionStrength: 0.25,
  ringRoadProbability: 0.65,
  ringRoadRadiusMultiplier: 1.4,
  carrierCount: 3,
  carrierForkSpacing: 80,
  carrierMinDistance: 120,
  mergeAreaThreshold: 1500,
  minSubdivisionArea: 7400,
  maxSubdivisionArea: 66000,
  antSubdivideWander: 0,
  antSnapDistance: 12,
  antSubdivideSnap: 16,
  subdivideSnap: 12,
  cleanupSnap: 3,
  enableSliverReduction: true,
  subdivideWarp: 4,
  subdivideRelax: 1,
  subdivisionDensity: 0.4,
  flowFieldInfluence: 0.004,
  flowFieldScaleLarge: 0.003,
  flowFieldScaleSmall: 0.08,
  terrainScale: 0.001,
  terrainWaterLevel: 0.42,
  riverCount: 2,
  maxTrafficTrips: 100,
};

export const DEFAULT_VIZ_SETTINGS: VisualizationSettings = {
  renderFlowField: false,
  renderElevation: false,
  renderHubs: true,
  renderShorelines: true,
  renderTraffic: true,
  roadOpacity: 160,
  roadThickness: 1.2,
  agentSize: 2.5,
  agentVectorLength: 5,
  roadNodeSize: 1.6,
  showForkAgents: true,
};

// ── Store shape ───────────────────────────────────────────────────────

interface UIState {
  // Persisted settings
  settings: SimulationSettings;
  vizSettings: VisualizationSettings;

  // Workflow
  activeStep: number;

  // Tick counter – bumped by the engine subscriber to trigger React re-renders
  tick: number;

  // Actions
  updateSetting: <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => void;
  updateVizSetting: <K extends keyof VisualizationSettings>(key: K, value: VisualizationSettings[K]) => void;
  resetSettings: () => void;
  setActiveStep: (step: number) => void;
  bumpTick: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      settings: { ...DEFAULT_SETTINGS },
      vizSettings: { ...DEFAULT_VIZ_SETTINGS },
      activeStep: 0,
      tick: 0,

      updateSetting: (key, value) =>
        set((s) => ({ settings: { ...s.settings, [key]: value } })),

      updateVizSetting: (key, value) =>
        set((s) => ({ vizSettings: { ...s.vizSettings, [key]: value } })),

      resetSettings: () =>
        set({ settings: { ...DEFAULT_SETTINGS } }),

      setActiveStep: (step) => set({ activeStep: step }),

      bumpTick: () => set((s) => ({ tick: s.tick + 1 })),
    }),
    {
      name: 'urban-genesis-settings-v2',
      // Only persist settings, not transient workflow state
      partialize: (state) => ({
        settings: state.settings,
        vizSettings: state.vizSettings,
      }),
    },
  ),
);
