/**
 * Simulation Engine
 *
 * Owns all mutable simulation state and a generic loop runner.
 * React never subscribes to individual fields — it reads `engine.state`
 * directly and is told to re-render via the subscriber/notify pattern.
 *
 * Settings are synced INTO the engine from the Zustand UI store so that
 * engine code never needs to import Zustand.
 *
 * Steps register their own tick/resolve/step callbacks via `runLoop()`.
 * The engine has no knowledge of specific simulation phases.
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

// ── Defaults (for initial settings before Zustand hydrates) ───────────
import { DEFAULT_SETTINGS, DEFAULT_VIZ_SETTINGS } from './uiStore';

// ── Subscriber pattern ────────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function notify(): void {
  listeners.forEach((fn) => fn());
}

// ── Loop callbacks interface ──────────────────────────────────────────

export interface LoopCallbacks {
  /** Called each interval tick while the loop is running. */
  onTick: () => void;
  /** Called to fast-forward this simulation to completion. */
  onResolve?: () => void;
  /** Called for a manual single-step (defaults to onTick if omitted). */
  onStep?: () => void;
  /** Interval in milliseconds between ticks (default 16). */
  intervalMs?: number;
}

// ── Simulation state ──────────────────────────────────────────────────

export const state: GenerationState = {
  simWidth: 2400,
  simHeight: 1800,
  activeStep: 0,
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

// ── Generic loop runner ───────────────────────────────────────────────

let loopInterval: ReturnType<typeof setInterval> | null = null;
let _running = false;
let _callbacks: LoopCallbacks | null = null;

function clearLoop(): void {
  if (loopInterval !== null) { clearInterval(loopInterval); loopInterval = null; }
  _running = false;
}

export function isRunning(): boolean {
  return _running;
}

/**
 * Start a simulation loop with the provided callbacks.
 * Any previously running loop is stopped first.
 */
export function runLoop(callbacks: LoopCallbacks): void {
  clearLoop();
  _callbacks = callbacks;
  _running = true;
  const interval = callbacks.intervalMs ?? 16;
  loopInterval = setInterval(() => {
    callbacks.onTick();
  }, interval);
  notify();
}

/** Bump the iteration counter and notify subscribers. */
export function tick(): void {
  state.iteration++;
  notify();
}

/** Resume a paused loop (re-starts interval with stored callbacks). */
export function start(): void {
  if (_running || !_callbacks) return;
  _running = true;
  const interval = _callbacks.intervalMs ?? 16;
  const cb = _callbacks;
  loopInterval = setInterval(() => {
    cb.onTick();
  }, interval);
  notify();
}

/** Pause the current loop (keeps callbacks for resume). */
export function pause(): void {
  if (loopInterval !== null) { clearInterval(loopInterval); loopInterval = null; }
  _running = false;
  notify();
}

/** Run a single step of the current simulation. */
export function step(): void {
  if (!_callbacks) return;
  const fn = _callbacks.onStep ?? _callbacks.onTick;
  fn();
}

/** Fast-forward the current simulation to completion, then stop. */
export function resolve(): void {
  if (!_callbacks) return;
  clearLoop();
  if (_callbacks.onResolve) {
    _callbacks.onResolve();
  }
  _callbacks = null;
  state.iteration++;
  notify();
}

/**
 * Clean up any running loop before transitioning to a new step.
 * Calls onResolve if available, then stops the loop.
 */
export function cleanup(): void {
  if (_callbacks?.onResolve) {
    clearLoop();
    _callbacks.onResolve();
    _callbacks = null;
    state.iteration++;
    notify();
  } else {
    clearLoop();
    _callbacks = null;
  }
}

/**
 * Stop the current loop without resolving.
 * Used internally by steps that manage their own completion.
 */
export function stopLoop(): void {
  clearLoop();
  _callbacks = null;
  notify();
}

// ── Convenience: the engine object for external access ────────────────

const engine = {
  state,
  subscribe,
  notify,
  isRunning,
  runLoop,
  tick,
  start,
  pause,
  step,
  resolve,
  cleanup,
  stopLoop,
  resetEngine,
  addEvent,
  addProfileLog,
  syncSettings,
  syncVizSettings,
};

export default engine;
