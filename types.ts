import React from 'react';
import { Vector2D } from './modules/Vector2D';
import { Ant } from './modules/Ant';
import { Hub } from './modules/Hub';
import { Segment2D } from './modules/Segment2D';
import { Shape2D } from './Shape2D';
import { Path2D } from './modules/Path2D';
import { Building } from './modules/Building';
import { FlowField } from './modules/FlowField';
import { ElevationMap } from './modules/ElevationMap';
import { River } from './modules/River';
import { ShapeSpatialGrid } from './modules/ShapeSpatialGrid';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  runTests: () => Promise<TestResult[]>;
  DemoComponent: React.FC;
}

export type AppView = 'generation' | 'concepts';

export type SimEventType = 'spawn' | 'death_lifetime' | 'death_collision' | 'death_oob' | 'death_stale' | 'death_water' | 'target_reached' | 'trail_left' | 'shapes_detected' | 'shapes_merged' | 'arterials_detected' | 'buildings_constructed' | 'traffic_simulated' | 'naming_complete' | 'bridge_built' | 'bridge_started';

export interface SimEvent {
  id: string;
  type: SimEventType;
  timestamp: number;
  antIds: string[];
  position: Vector2D;
  extraPos?: Vector2D; // For segment events
  data?: any;
}

export interface ProfileLog {
  id: string;
  functionName: string;
  duration: number;
  timestamp: number;
}

export type AntType = 'hub' | 'termination' | 'perpendicular' | 'ring' | 'outward' | 'sprawl' | 'carrier' | 'fork' | 'bridge';

export interface HubMetadata {
  id: string;
  name?: string;
  position: { x: number; y: number };
  size: number;
  tier: number;
  distToWater: number;
  labelOffset?: { x: number; y: number };
}

export interface WaterBodyMetadata {
  id: string;
  name?: string;
  area: number;
  center: { x: number; y: number };
  labelOffset?: { x: number; y: number };
}

export interface BridgeMetadata {
  id: string;
  name?: string;
  midpoint: { x: number; y: number };
  length: number;
  labelOffset?: { x: number; y: number };
}

export interface NotableShapeMetadata {
  id: string;
  name?: string;
  area: number;
  center: { x: number; y: number };
  distToNearestHub: number;
  nearestHubId: string | null;
  labelOffset?: { x: number; y: number };
}

export interface GeographyMetadata {
  hubs: HubMetadata[];
  waterBodies: WaterBodyMetadata[];
  bridges: BridgeMetadata[];
  notableShapes: NotableShapeMetadata[];
}

export interface SimulationSettings {
  // Global simulation speed
  simSpeed: number;

  // Urban Growth
  hubCount: number;
  antsPerHub: number;
  spawnIntensity: number; // Global multiplier for all spawning logic
  hubInfluence: number;
  hubDirectness: number; // Ratio of ants that take a direct path to the target hub
  antTurnSpeed: number;
  antWaves: number; // Number of spawning waves
  
  // Bridges
  bridgeProbability: number; // Chance per wave to attempt bridge spawning
  maxBridgeLength: number; // Maximum world-units a bridge can span

  // Ring Roads
  ringRoadProbability: number;
  ringRoadRadiusMultiplier: number;
  
  // Agent Behavior
  antMaxLife: number;
  antTrailDistance: number;
  antWanderIntensity: number;
  antRoadSurvivalChance: number;
  minLongRoadLength: number; // Minimum length of a road stretch to trigger fuchsia perpendicular spawning
  antParallelRepulsion: number; // Strength of force pushing away from parallel roads
  minParallelDist: number; // Distance at which parallel repulsion kicks in
  antAttractionRadius: number; // Distance at which opposing ants pull together
  antAttractionStrength: number; // Intensity of the magnetism
  
  // Agent Behavioral Refinements
  carrierCount: number;
  carrierForkSpacing: number; 
  carrierMinDistance: number;

  // Discovery & Subdivision
  mergeAreaThreshold: number;
  minSubdivisionArea: number;
  maxSubdivisionArea: number;
  antSubdivideWander: number;
  antSnapDistance: number;
  antSubdivideSnap: number;
  subdivideSnap: number; // Explicit variable for grid clipping
  cleanupSnap: number; // Aggressive cleanup threshold for post-ant simulation
  enableSliverReduction: boolean;
  subdivideWarp: number;
  subdivideRelax: number;
  subdivisionDensity: number;
  
  // Environment
  flowFieldInfluence: number;
  flowFieldScaleLarge: number;
  flowFieldScaleSmall: number;
  terrainScale: number;
  terrainWaterLevel: number;
  riverCount: number; // Number of primary rivers to carve

  // Traffic
  maxTrafficTrips: number;
}

export interface VisualizationSettings {
  renderFlowField: boolean;
  renderElevation: boolean;
  renderHubs: boolean;
  renderShorelines: boolean;
  renderTraffic: boolean;
  roadOpacity: number;
  roadThickness: number;
  agentSize: number;
  agentVectorLength: number;
  roadNodeSize: number;
  showForkAgents: boolean;
}

export interface GenerationState {
  simWidth: number;
  simHeight: number;
  hubs: Hub[];
  hubQueue: Hub[]; // Staged hubs for animation
  exits: Vector2D[];
  ants: Ant[];
  roads: Segment2D[];
  recentRoads: Segment2D[]; 
  rivers: River[];
  shapes: Shape2D[];
  shapeGrid?: ShapeSpatialGrid; 
  subdivisionQueue: number[]; // Queue of shape indices waiting for subdivision
  processedShapeIndices: Set<number>; 
  buildings: Building[];
  arterials: Path2D[];
  shorelines: Segment2D[];
  geography: GeographyMetadata;
  hoveredGeoId: string | null;
  activeSubdivisionIndex: number | null; 
  usageMap: Map<string, number>; 
  usageCount: number;
  activePath: Vector2D[] | null;
  events: SimEvent[];
  profileLogs: ProfileLog[];
  renderTimings: Record<string, number>; 
  iteration: number;
  lastReset: number; // Explicit signal for cache invalidation
  currentWave: number;
  subdivisionWave: number;
  settings: SimulationSettings;
  visualizationSettings: VisualizationSettings;
  flowField?: FlowField;
  elevation?: ElevationMap;
  primaryGuidePaths: Record<string, Vector2D[]>;
  isBakingElevation: boolean;
  elevationBakeProgress: number;
}