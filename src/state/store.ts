import { GenerationState, SimEvent, SimEventType, SimulationSettings, VisualizationSettings, ProfileLog } from '../types';
import { Vector2D } from '../modules/Vector2D';

const SETTINGS_KEY = 'urban_genesis_settings_v34'; 
const VIZ_SETTINGS_KEY = 'urban_genesis_viz_settings_v7';

export const DEFAULT_SETTINGS: SimulationSettings = {
  "simSpeed": 12,
  "hubCount": 12,
  "antsPerHub": 2,
  "spawnIntensity": 0.2,
  "hubInfluence": 0.05,
  "hubDirectness": 0.15,
  "antTurnSpeed": 0.001,
  "antWaves": 8,
  "bridgeProbability": 0.85,
  "maxBridgeLength": 600,
  "antMaxLife": 1000,
  "antTrailDistance": 6,
  "antWanderIntensity": 0.01,
  "antRoadSurvivalChance": 0.3,
  "minLongRoadLength": 40,
  "antParallelRepulsion": 0.35,
  "minParallelDist": 45,
  "antAttractionRadius": 50,
  "antAttractionStrength": 0.25,
  "ringRoadProbability": 0.65,
  "ringRoadRadiusMultiplier": 1.4,
  "carrierCount": 3,
  "carrierForkSpacing": 80,
  "carrierMinDistance": 120,
  "mergeAreaThreshold": 1500,
  "minSubdivisionArea": 7400,
  "maxSubdivisionArea": 66000,
  "antSubdivideWander": 0,
  "antSnapDistance": 12,
  "antSubdivideSnap": 16,
  "subdivideSnap": 12,
  "cleanupSnap": 3,
  "enableSliverReduction": true,
  "subdivideWarp": 4,
  "subdivideRelax": 1,
  "subdivisionDensity": 0.4,
  "flowFieldInfluence": 0.004,
  "flowFieldScaleLarge": 0.003,
  "flowFieldScaleSmall": 0.08,
  "terrainScale": 0.001,
  "terrainWaterLevel": 0.42,
  "riverCount": 2,
  "maxTrafficTrips": 100
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
  showForkAgents: true
};

const loadSettings = (): SimulationSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('UrbanGenesis: Error loading settings', e);
  }
  return { ...DEFAULT_SETTINGS };
};

const loadVizSettings = (): VisualizationSettings => {
  try {
    const saved = localStorage.getItem(VIZ_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_VIZ_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('UrbanGenesis: Error loading viz settings', e);
  }
  return { ...DEFAULT_VIZ_SETTINGS };
};

export const saveSettings = (settings: SimulationSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('UrbanGenesis: Error saving settings', e);
  }
};

export const saveVizSettings = (settings: VisualizationSettings) => {
  try {
    localStorage.setItem(VIZ_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('UrbanGenesis: Error saving viz settings', e);
  }
};

export const state: GenerationState = {
  simWidth: 2400,
  simHeight: 1800,
  hubs: [],
  hubQueue: [],
  exits: [],
  ants: [],
  roads: [],
  recentRoads: [],
  rivers: [],
  shapes: [],
  shapeGrid: undefined,
  subdivisionQueue: [],
  processedShapeIndices: new Set(),
  buildings: [],
  arterials: [],
  shorelines: [],
  geography: {
    hubs: [],
    waterBodies: [],
    bridges: [],
    notableShapes: []
  },
  hoveredGeoId: null,
  activeSubdivisionIndex: null,
  usageMap: new Map(),
  usageCount: 0,
  activePath: null,
  events: [],
  profileLogs: [],
  renderTimings: {},
  iteration: 0,
  lastReset: 0,
  currentWave: 0,
  subdivisionWave: 0,
  primaryGuidePaths: {},
  settings: loadSettings(),
  visualizationSettings: loadVizSettings(),
  isBakingElevation: false,
  elevationBakeProgress: 0
};

export const resetState = () => {
  state.hubs = [];
  state.hubQueue = [];
  state.exits = [];
  state.ants = [];
  state.roads = [];
  state.recentRoads = [];
  state.rivers = [];
  state.shapes = [];
  state.shapeGrid = undefined;
  state.subdivisionQueue = [];
  state.processedShapeIndices = new Set();
  state.buildings = [];
  state.arterials = [];
  state.shorelines = [];
  state.geography = {
    hubs: [],
    waterBodies: [],
    bridges: [],
    notableShapes: []
  };
  state.hoveredGeoId = null;
  state.activeSubdivisionIndex = null;
  state.usageMap = new Map();
  state.usageCount = 0;
  state.activePath = null;
  state.events = [];
  state.profileLogs = [];
  state.renderTimings = {};
  state.iteration = 0; 
  state.lastReset = Date.now();
  state.currentWave = 0;
  state.subdivisionWave = 0;
  state.primaryGuidePaths = {};
  state.flowField = undefined;
  state.elevation = undefined;
  state.isBakingElevation = false;
  state.elevationBakeProgress = 0;
};

export const addEvent = (type: SimEventType, antIds: string[], position: Vector2D, extraPos?: Vector2D, data?: any) => {
  const event: SimEvent = {
    id: Math.random().toString(36).substr(2, 9),
    type,
    timestamp: Date.now(),
    antIds,
    position: position.copy(),
    extraPos: extraPos ? extraPos.copy() : undefined,
    data
  };
  state.events.push(event);
  if (state.events.length > 150) {
    state.events.shift();
  }
};

export const addProfileLog = (functionName: string, duration: number) => {
  const log: ProfileLog = {
    id: Math.random().toString(36).substr(2, 9),
    functionName,
    duration,
    timestamp: Date.now()
  };
  state.profileLogs.unshift(log);
  if (state.profileLogs.length > 30) {
    state.profileLogs.pop();
  }
};