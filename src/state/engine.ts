/**
 * Simulation Engine
 *
 * Owns all mutable simulation state and orchestration loops.
 * React never subscribes to individual fields — it reads `engine.state`
 * directly and is told to re-render via the subscriber/notify pattern.
 *
 * Settings are synced INTO the engine from the Zustand UI store so that
 * engine code never needs to import Zustand.
 */

import {
  GenerationState,
  SimEvent,
  SimEventType,
  SimulationSettings,
  VisualizationSettings,
  ProfileLog,
} from '../types';
import { Vector2D } from '../modules/Vector2D';
import { Ant } from '../modules/Ant';
import { Hub } from '../modules/Hub';
import { Segment2D } from '../modules/Segment2D';
import { SpatialGrid } from '../modules/SpatialGrid';
import { RoadNetwork } from '../modules/RoadNetwork';
import { Capsule2D } from '../modules/Capsule2D';
import { TerrainCulling } from '../modules/TerrainCulling';
import { ShapeDetector } from '../modules/ShapeDetector';
import { ArterialDetector } from '../modules/ArterialDetector';

// Step loop internals still need these imports (called from engine loops)
import { spawnAntWave } from '../steps/urban_growth';
import { subdivideShape, finalizeSubdivision } from '../steps/block_subdivision';
import { runTrafficSimulation } from '../steps/traffic_simulation';
import { profile } from '../utils/Profiler';

// ── Defaults (for initial settings before Zustand hydrates) ───────────
import { DEFAULT_SETTINGS, DEFAULT_VIZ_SETTINGS } from './uiStore';

// ── Subscriber pattern ────────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function notify(): void {
  listeners.forEach((fn) => fn());
}

// ── Engine phase ──────────────────────────────────────────────────────

export type { EnginePhase } from './engineTypes';
import type { EnginePhase } from './engineTypes';

// ── Simulation state ──────────────────────────────────────────────────

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
  arterials: [],
  shorelines: [],
  geography: { hubs: [], waterBodies: [], bridges: [], notableShapes: [] },
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
  settings: { ...DEFAULT_SETTINGS },
  visualizationSettings: { ...DEFAULT_VIZ_SETTINGS },
  flowField: undefined,
  elevation: undefined,
  isBakingElevation: false,
  elevationBakeProgress: 0,
};

// ── Settings sync (called by uiStore subscriber) ──────────────────────

export function syncSettings(settings: SimulationSettings): void {
  state.settings = settings;
}

export function syncVizSettings(vizSettings: VisualizationSettings): void {
  state.visualizationSettings = vizSettings;
}

// ── State helpers ─────────────────────────────────────────────────────

export function resetEngine(): void {
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
  state.arterials = [];
  state.shorelines = [];
  state.geography = { hubs: [], waterBodies: [], bridges: [], notableShapes: [] };
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
}

export function addEvent(
  type: SimEventType,
  antIds: string[],
  position: Vector2D,
  extraPos?: Vector2D,
  data?: Record<string, string | number>,
): void {
  const event: SimEvent = {
    id: Math.random().toString(36).substr(2, 9),
    type,
    timestamp: Date.now(),
    antIds,
    position: position.copy(),
    extraPos: extraPos ? extraPos.copy() : undefined,
    data,
  };
  state.events.push(event);
  if (state.events.length > 150) state.events.shift();
}

export function addProfileLog(functionName: string, duration: number): void {
  const log: ProfileLog = {
    id: Math.random().toString(36).substr(2, 9),
    functionName,
    duration,
    timestamp: Date.now(),
  };
  state.profileLogs.unshift(log);
  if (state.profileLogs.length > 30) state.profileLogs.pop();
}

// ── Phase state machine ───────────────────────────────────────────────

let currentPhase: EnginePhase = 'idle';
let loopInterval: ReturnType<typeof setInterval> | null = null;
let _running = false;
let _cooldown = 0;

// Spatial grids used by the ant simulation (moved from useSimulation)
let spatialGrid: SpatialGrid<Vector2D> | null = null;
let antGrid: SpatialGrid<Ant> | null = null;
let roadGrid: SpatialGrid<Segment2D> | null = null;
let lastRoadCount = -1;

export function getPhase(): EnginePhase {
  return currentPhase;
}

export function isRunning(): boolean {
  return _running;
}

// ── Internal simulation helpers (moved from useSimulation.ts) ─────────

function syncRoadGrid(force = false): void {
  if (!force && state.roads.length === lastRoadCount && spatialGrid) return;
  profile('Simulation.syncRoadGrid', () => {
    const snapThreshold = state.settings.antSnapDistance;
    const vertexGrid = new SpatialGrid<Vector2D>(snapThreshold * 2);
    const segmentGrid = new SpatialGrid<Segment2D>(60);
    state.roads.forEach((r) => {
      vertexGrid.insert(r.p1, r.p1);
      vertexGrid.insert(r.p2, r.p2);
      segmentGrid.insert(r.midpoint(), r);
    });
    spatialGrid = vertexGrid;
    roadGrid = segmentGrid;
    lastRoadCount = state.roads.length;
  });
}

function syncAntGrid(): void {
  const gridSize = Math.max(20, state.settings.antAttractionRadius);
  const grid = new SpatialGrid<Ant>(gridSize);
  state.ants.forEach((a) => { if (a.isAlive) grid.insert(a.position, a); });
  antGrid = grid;
}

function findRoadIntersection(p1: Vector2D, p2: Vector2D): { point: Vector2D; segment: Segment2D } | null {
  const moveSeg = new Segment2D(p1, p2);
  let nearestHit: Vector2D | null = null;
  let nearestSeg: Segment2D | null = null;
  let minDist = Infinity;
  const searchRadius = moveSeg.length() + 40;
  const candidates = roadGrid ? roadGrid.query(moveSeg.midpoint(), searchRadius, (s) => s.midpoint()) : state.roads;
  for (const road of candidates) {
    const hit = moveSeg.intersect(road);
    if (hit) {
      const d = p1.dist(hit);
      if (d > 0.1 && d < minDist) { minDist = d; nearestHit = hit; nearestSeg = road; }
    }
  }
  return nearestHit && nearestSeg ? { point: nearestHit, segment: nearestSeg } : null;
}

function checkCapsuleCollision(p1: Vector2D, p2: Vector2D, radius: number, excludePoint?: Vector2D): boolean {
  const moveCap = new Capsule2D(p1, p2, radius);
  const searchRadius = p1.dist(p2) + radius + 40;
  const candidates = roadGrid ? roadGrid.query(p1.add(p2).div(2), searchRadius, (s) => s.midpoint()) : state.roads;
  for (const road of candidates) {
    if (excludePoint && (road.p1.dist(excludePoint) < 1.5 || road.p2.dist(excludePoint) < 1.5)) continue;
    const roadCap = new Capsule2D(road.p1, road.p2, 0);
    if (moveCap.intersects(roadCap)) return true;
  }
  return false;
}

function findBoundaryIntersection(p1: Vector2D, p2: Vector2D, ant: Ant): Vector2D | null {
  if (!ant.parentShape) return null;
  const moveSeg = new Segment2D(p1, p2);
  const boundary = ant.parentShape.toSegments();
  let nearestHit: Vector2D | null = null;
  let minDist = Infinity;
  for (const seg of boundary) {
    const hit = moveSeg.intersect(seg);
    if (hit) {
      const d = p1.dist(hit);
      if (d > 0.5 && d < minDist) { minDist = d; nearestHit = hit; }
    }
  }
  return nearestHit;
}

function checkCollisions(): void {
  if (!antGrid) return;
  const aliveAnts = state.ants.filter((a) => a.isAlive);
  const collisionDist = 14;
  const facingThreshold = -0.6;
  const arterialSnap = state.settings.antSnapDistance;
  const processedPairs = new Set<string>();
  for (let i = 0; i < aliveAnts.length; i++) {
    const antA = aliveAnts[i];
    if (!antA.isAlive || antA.parentShape || antA.type === 'bridge') continue;
    if (antA.maxLife - antA.life < 10) continue;
    const neighbors = antGrid.query(antA.position, collisionDist, (a) => a.position);
    for (const antB of neighbors) {
      if (antA === antB || !antB.isAlive || antB.parentShape || antB.type === 'bridge') continue;
      if (antB.maxLife - antB.life < 10) continue;
      const pairKey = antA.id < antB.id ? `${antA.id}:${antB.id}` : `${antB.id}:${antA.id}`;
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);
      if (Ant.checkCollision(antA, antB, collisionDist, facingThreshold)) {
        const midPoint = antA.position.add(antB.position).div(2);
        RoadNetwork.addSegmentSnapped(antA.lastTrailPos, midPoint, state.roads, arterialSnap * 1.5, spatialGrid || undefined);
        RoadNetwork.addSegmentSnapped(antB.lastTrailPos, midPoint, state.roads, arterialSnap * 1.5, spatialGrid || undefined);
        antA.kill();
        antB.kill();
        break;
      }
    }
  }
}

function processAnt(ant: Ant): void {
  if (!ant.isAlive) return;
  let snapThreshold = ant.parentShape ? state.settings.antSubdivideSnap : state.settings.antSnapDistance;
  if (ant.type === 'bridge') snapThreshold = 20;
  const oldPos = ant.position.copy();
  let nearbyAnts: Ant[] = [];
  if (antGrid) nearbyAnts = antGrid.query(ant.position, state.settings.antAttractionRadius, (a) => a.position);
  const result = ant.update(state.flowField, state.settings.flowFieldInfluence, state.simWidth, state.simHeight, nearbyAnts);
  const newPos = ant.position;

  if (ant.type === 'bridge') {
    if (result === 'trail_left' || result === 'target_reached' || result === 'death_lifetime') {
      const seg = RoadNetwork.addSegmentSnapped(ant.lastTrailPos, ant.position, state.roads, snapThreshold, spatialGrid || undefined);
      if (seg) seg.isBridge = true;
      ant.commitTrail();
      if (result === 'target_reached') {
        addEvent('bridge_built', [], ant.position, undefined, { message: 'Strategic connection established.' });
        const spawnCount = 4;
        for (let i = 0; i < spawnCount; i++) {
          const angle = (i / spawnCount) * Math.PI * 2;
          const dir = new Vector2D(Math.cos(angle), Math.sin(angle));
          const targetHub = state.hubs[Math.floor(Math.random() * state.hubs.length)];
          state.ants.push(new Ant(ant.position.copy(), targetHub.position, {
            type: 'sprawl', speed: 1.2, life: state.settings.antMaxLife * 0.7,
            trailDistance: state.settings.antTrailDistance, initialDirection: dir,
            wanderIntensity: 0.1, settings: state.settings,
          }));
        }
      }
    }
    return;
  }

  if (ant.type === 'fork' && ant.maxLife - ant.life > 5) {
    if (checkCapsuleCollision(oldPos, newPos, 4, ant.lastTrailPos)) {
      RoadNetwork.addSegmentSnapped(ant.lastTrailPos, oldPos, state.roads, snapThreshold, spatialGrid || undefined);
      ant.kill();
      return;
    }
  }

  if (result === 'death_oob' || result === 'death_stale' || result === 'death_water') {
    RoadNetwork.addSegmentSnapped(ant.lastTrailPos, oldPos, state.roads, snapThreshold, spatialGrid || undefined);
    return;
  }

  let hit: Vector2D | null = null;
  let hitSeg: Segment2D | null = null;
  if (ant.parentShape) {
    hit = findBoundaryIntersection(oldPos, newPos, ant);
  } else {
    const roadHit = findRoadIntersection(oldPos, newPos);
    if (roadHit) { hit = roadHit.point; hitSeg = roadHit.segment; }
  }

  if (hit) {
    ant.position = hit.copy();
    RoadNetwork.addSegmentSnapped(ant.lastTrailPos, ant.position, state.roads, snapThreshold * 1.5, spatialGrid || undefined);
    const survives = !ant.parentShape && Math.random() < state.settings.antRoadSurvivalChance;
    if (survives) {
      if (hitSeg) {
        const sDir = hitSeg.p2.sub(hitSeg.p1).normalize();
        let normal = new Vector2D(-sDir.y, sDir.x);
        if (normal.dot(ant.direction) < 0) normal = normal.mul(-1);
        ant.direction = normal;
      }
      ant.commitTrail();
      ant.position = ant.position.add(ant.direction.mul(5.0));
    } else {
      ant.kill();
    }
    return;
  }

  if (result === 'trail_left') {
    RoadNetwork.addSegmentSnapped(ant.lastTrailPos, ant.position, state.roads, snapThreshold, spatialGrid || undefined);
    if (ant.type === 'carrier' && ant.accumulatedDistance > state.settings.carrierMinDistance) {
      if (ant.distanceSinceLastFork >= state.settings.carrierForkSpacing) {
        [1, -1].forEach((side) => {
          const turnAngle = Math.PI / 2;
          const newDir = new Vector2D(
            ant.direction.x * Math.cos(turnAngle * side) - ant.direction.y * Math.sin(turnAngle * side),
            ant.direction.x * Math.sin(turnAngle * side) + ant.direction.y * Math.cos(turnAngle * side),
          );
          state.ants.push(new Ant(ant.position.copy(), ant.position.add(newDir.mul(1000)), {
            type: 'fork', speed: ant.speed * 0.95, life: ant.life * 0.6, turnSpeed: 0,
            initialDirection: newDir, trailDistance: ant.trailDistance,
            wanderIntensity: 0.001, settings: state.settings,
          }));
        });
        ant.distanceSinceLastFork = 0;
      }
    }
    ant.commitTrail();
  } else if (result === 'target_reached' || result === 'death_lifetime') {
    RoadNetwork.addSegmentSnapped(ant.lastTrailPos, ant.position, state.roads, snapThreshold, spatialGrid || undefined);
  }
}

// ── Phase loop implementations ────────────────────────────────────────

function clearLoop(): void {
  if (loopInterval !== null) { clearInterval(loopInterval); loopInterval = null; }
  _running = false;
}

function resetSpatialGrids(): void {
  spatialGrid = null;
  antGrid = null;
  roadGrid = null;
  lastRoadCount = -1;
}

/** Hub animation: pop one hub from queue every 300ms */
function startHubAnimationLoop(): void {
  clearLoop();
  _running = true;
  currentPhase = 'hub_animation';

  loopInterval = setInterval(() => {
    const hub = state.hubQueue.shift();
    if (hub) {
      hub.spawnTime = Date.now();
      state.hubs.push(hub);
      const pts = hub.shapePoints;
      for (let v = 0; v < pts.length; v++) {
        RoadNetwork.addSegmentSnapped(pts[v], pts[(v + 1) % pts.length], state.roads, 5);
      }
      let minDist = Infinity;
      state.shorelines.forEach((s) => {
        const cp = s.closestPoint(hub.position);
        const d = hub.position.dist(cp);
        if (d < minDist) minDist = d;
      });
      state.geography.hubs.push({
        id: hub.id, position: { x: hub.position.x, y: hub.position.y },
        size: hub.size, tier: hub.tier, distToWater: minDist,
      });
      state.iteration++;
      notify();
    }
    if (state.hubQueue.length === 0) {
      finishHubPhase();
      notify();
    }
  }, 300);
}

function finishHubPhase(): void {
  clearLoop();
  if (state.elevation) {
    state.roads = TerrainCulling.cullSegments(state.roads, state.elevation, state.settings.terrainWaterLevel);
  }
  const detectedShapes = ShapeDetector.detectShapes(state.roads);
  state.shapes = detectedShapes;
  if (detectedShapes.length > 0) {
    state.arterials = ArterialDetector.detectArterialsFromShapes(detectedShapes, 45);
  }
  currentPhase = 'idle';
}

/** Resolve all hubs instantly (skip animation) */
function resolveHubs(): void {
  clearLoop();
  while (state.hubQueue.length > 0) {
    const hub = state.hubQueue.shift();
    if (hub) {
      hub.spawnTime = Date.now();
      state.hubs.push(hub);
      const pts = hub.shapePoints;
      for (let v = 0; v < pts.length; v++) {
        RoadNetwork.addSegmentSnapped(pts[v], pts[(v + 1) % pts.length], state.roads, 5);
      }
    }
  }
  state.geography.hubs = state.hubs.map((hub: Hub) => {
    let minDist = Infinity;
    state.shorelines.forEach((s) => {
      const cp = s.closestPoint(hub.position);
      const d = hub.position.dist(cp);
      if (d < minDist) minDist = d;
    });
    return { id: hub.id, position: { x: hub.position.x, y: hub.position.y }, size: hub.size, tier: hub.tier, distToWater: minDist };
  });
  finishHubPhase();
}

/** Ant simulation at ~60fps */
function startAntSimulationLoop(): void {
  clearLoop();
  _running = true;
  currentPhase = 'ant_simulation';
  _cooldown = 0;

  loopInterval = setInterval(() => {
    if (_cooldown > 0) { _cooldown--; return; }
    syncRoadGrid();
    syncAntGrid();
    let anyAlive = false;
    const stepsPerFrame = Math.max(1, state.settings.simSpeed);
    for (let i = 0; i < stepsPerFrame; i++) {
      if (stepsPerFrame > 5 && i % 2 === 0) syncAntGrid();
      for (let j = 0; j < state.ants.length; j++) {
        const ant = state.ants[j];
        if (ant.isAlive) { processAnt(ant); if (ant.isAlive) anyAlive = true; }
      }
      checkCollisions();
      if (!anyAlive) break;
    }

    if (!anyAlive && state.ants.length > 0) {
      if (state.currentWave > 0 && state.currentWave < state.settings.antWaves) {
        _cooldown = 1;
        state.currentWave++;
        profile('WaveTransition.spawnNextWave', () => spawnAntWave());
      } else {
        clearLoop();
        resetSpatialGrids();
        const currentSnap = state.ants.some((a) => a.parentShape) ? state.settings.antSubdivideSnap : state.settings.cleanupSnap;
        profile('RoadNetwork.cleanupWaveEnd', () => {
          state.roads = RoadNetwork.cleanupNetwork(state.roads, currentSnap);
        });
        currentPhase = 'idle';
      }
    }
    state.iteration++;
    notify();
  }, 16);
}

/** Step the ant simulation once (manual step) */
function stepAntSimulation(): void {
  profile('Simulation.stepBulk', () => {
    syncRoadGrid();
    syncAntGrid();
    const steps = 10 * Math.max(1, state.settings.simSpeed);
    for (let i = 0; i < steps; i++) {
      let anyAlive = false;
      if (i % 5 === 0) syncAntGrid();
      for (let j = 0; j < state.ants.length; j++) {
        const ant = state.ants[j];
        if (ant.isAlive) { processAnt(ant); if (ant.isAlive) anyAlive = true; }
      }
      checkCollisions();
      if (!anyAlive && state.ants.length > 0) break;
    }
  });
  state.iteration++;
  notify();
}

/** Resolve all ants instantly */
function resolveAntSimulation(): void {
  clearLoop();
  resetSpatialGrids();
  profile('Simulation.resolveInstant', () => {
    let anyAlive = true;
    let safetyCounter = 0;
    while (anyAlive && safetyCounter < 5000) {
      syncRoadGrid();
      syncAntGrid();
      anyAlive = false;
      for (let j = 0; j < state.ants.length; j++) {
        const ant = state.ants[j];
        if (ant.isAlive) { processAnt(ant); if (ant.isAlive) anyAlive = true; }
      }
      checkCollisions();
      if (!anyAlive && state.currentWave > 0 && state.currentWave < state.settings.antWaves) {
        state.currentWave++;
        spawnAntWave();
        anyAlive = true;
      }
      safetyCounter++;
    }
  });
  const currentSnap = state.ants.some((a) => a.parentShape) ? state.settings.antSubdivideSnap : state.settings.cleanupSnap;
  profile('RoadNetwork.cleanupFinal', () => {
    state.roads = RoadNetwork.cleanupNetwork(state.roads, currentSnap);
  });
  currentPhase = 'idle';
  _running = false;
  state.iteration++;
  notify();
}

/** Subdivision at ~60fps */
function startSubdivisionLoop(): void {
  clearLoop();
  _running = true;
  currentPhase = 'subdivision';

  loopInterval = setInterval(() => {
    const speed = Math.max(1, state.settings.simSpeed);
    for (let i = 0; i < speed; i++) {
      if (state.subdivisionQueue.length === 0) break;
      const index = state.subdivisionQueue.shift();
      if (index === undefined) break;
      state.activeSubdivisionIndex = index;
      subdivideShape(index);
      state.processedShapeIndices.add(index);
    }
    if (state.subdivisionQueue.length === 0) {
      state.activeSubdivisionIndex = null;
      finalizeSubdivision();
      clearLoop();
      currentPhase = 'idle';
    }
    state.iteration++;
    notify();
  }, 16);
}

function stepSubdivision(): void {
  if (state.subdivisionQueue.length === 0) return;
  const index = state.subdivisionQueue.shift();
  if (index === undefined) return;
  state.activeSubdivisionIndex = index;
  subdivideShape(index);
  state.processedShapeIndices.add(index);
  if (state.subdivisionQueue.length === 0) {
    state.activeSubdivisionIndex = null;
    finalizeSubdivision();
    currentPhase = 'idle';
    _running = false;
  }
  state.iteration++;
  notify();
}

function resolveSubdivision(): void {
  clearLoop();
  while (state.subdivisionQueue.length > 0) {
    const index = state.subdivisionQueue.shift();
    if (index !== undefined) {
      state.activeSubdivisionIndex = index;
      subdivideShape(index);
      state.processedShapeIndices.add(index);
    }
  }
  state.activeSubdivisionIndex = null;
  finalizeSubdivision();
  currentPhase = 'idle';
  _running = false;
  state.iteration++;
  notify();
}

/** Traffic simulation at ~15fps */
function startTrafficLoop(): void {
  clearLoop();
  _running = true;
  currentPhase = 'traffic';

  loopInterval = setInterval(() => {
    const speed = Math.max(1, state.settings.simSpeed);
    let more = true;
    for (let i = 0; i < speed; i++) {
      more = runTrafficSimulation();
      if (!more) break;
    }
    if (!more) {
      clearLoop();
      currentPhase = 'idle';
    }
    state.iteration++;
    notify();
  }, 60);
}

function stepTraffic(): void {
  runTrafficSimulation();
  state.iteration++;
  notify();
}

function resolveTraffic(): void {
  clearLoop();
  while (runTrafficSimulation()) { /* run to completion */ }
  currentPhase = 'idle';
  _running = false;
  state.iteration++;
  notify();
}

// ── Public engine controls ────────────────────────────────────────────

/**
 * Clean up any running phase before transitioning to a new one.
 * Called by step execute() functions before starting their work.
 */
export function cleanupCurrentPhase(): void {
  if (currentPhase === 'hub_animation') resolveHubs();
  if (currentPhase === 'subdivision') resolveSubdivision();
  if (currentPhase === 'ant_simulation') resolveAntSimulation();
  if (currentPhase === 'traffic') resolveTraffic();
  clearLoop();
}

/**
 * Set the engine phase and running state without starting a loop.
 * Used by synchronous/async steps (landscape, structural analysis, naming).
 */
export function setPhase(phase: EnginePhase, running = false): void {
  currentPhase = phase;
  _running = running;
  notify();
}

/**
 * Start the appropriate loop for the given phase.
 * Called by step execute() functions after their setup work.
 */
export function startPhase(phase: EnginePhase): void {
  switch (phase) {
    case 'hub_animation': startHubAnimationLoop(); notify(); break;
    case 'ant_simulation': startAntSimulationLoop(); notify(); break;
    case 'subdivision': startSubdivisionLoop(); notify(); break;
    case 'traffic': startTrafficLoop(); notify(); break;
    default: break;
  }
}

/** Bump the iteration counter and notify subscribers. */
export function tick(): void {
  state.iteration++;
  notify();
}

/** Start / resume the current phase loop */
export function start(): void {
  if (_running) return;
  switch (currentPhase) {
    case 'hub_animation': startHubAnimationLoop(); break;
    case 'ant_simulation': startAntSimulationLoop(); break;
    case 'subdivision': startSubdivisionLoop(); break;
    case 'traffic': startTrafficLoop(); break;
    default: break;
  }
}

/** Pause the current phase loop */
export function pause(): void {
  clearLoop();
}

/** Single step in the current phase */
export function step(): void {
  switch (currentPhase) {
    case 'ant_simulation': stepAntSimulation(); break;
    case 'subdivision': stepSubdivision(); break;
    case 'traffic': stepTraffic(); break;
    default: break;
  }
}

/** Fast-forward current phase to completion */
export function resolve(): void {
  switch (currentPhase) {
    case 'hub_animation': resolveHubs(); state.iteration++; notify(); break;
    case 'ant_simulation': resolveAntSimulation(); break;
    case 'subdivision': resolveSubdivision(); break;
    case 'traffic': resolveTraffic(); break;
    default: break;
  }
}

// ── Convenience: the engine object for external access ────────────────

const engine = {
  state,
  subscribe,
  notify,
  getPhase,
  isRunning,
  cleanupCurrentPhase,
  setPhase,
  startPhase,
  tick,
  start,
  pause,
  step,
  resolve,
  resetEngine,
  addEvent,
  addProfileLog,
  syncSettings,
  syncVizSettings,
};

export default engine;
