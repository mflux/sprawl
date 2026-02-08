import engine, { state, addEvent } from '../state/engine';
import { TransposeGrid } from '../modules/TransposeGrid';
import { ArterialDetector } from '../modules/ArterialDetector';
import { RoadNetwork } from '../modules/RoadNetwork';
import { TerrainCulling } from '../modules/TerrainCulling';
import { Vector2D } from '../modules/Vector2D';
import { Path2D } from '../modules/Path2D';
import { getPathBounds } from '../modules/Culling';
import { ShapeSpatialGrid } from '../modules/ShapeSpatialGrid';
import type { StepDefinition } from './types';

export const step: StepDefinition = {
  id: 'block_subdivision',
  label: 'Subdiv',
  title: 'Block Subdivision',
  desc: 'Refines blocks with internal streets. Uses a Transpose Grid approach aligned to the longest arterial in each block.',
  vizTransitions: {},
  initialSimSpeed: 1,
  hasSimControls: true,
  execute: () => {
    prepareSubdivision();
    engine.tick();
    engine.runLoop({
      onTick: subdivisionTick,
      onStep: subdivisionStep,
      onResolve: subdivisionResolve,
      intervalMs: 16,
    });
  },
  isComplete: () => state.subdivisionQueue.length === 0 && !engine.isRunning(),
};

function subdivisionTick(): void {
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
    engine.stopLoop();
  }
  state.iteration++;
  engine.notify();
}

function subdivisionStep(): void {
  if (state.subdivisionQueue.length === 0) return;
  const index = state.subdivisionQueue.shift();
  if (index === undefined) return;
  state.activeSubdivisionIndex = index;
  subdivideShape(index);
  state.processedShapeIndices.add(index);
  if (state.subdivisionQueue.length === 0) {
    state.activeSubdivisionIndex = null;
    finalizeSubdivision();
    engine.stopLoop();
  }
  state.iteration++;
  engine.notify();
}

function subdivisionResolve(): void {
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
}

/**
 * Prepares the state for the subdivision pass by identifying valid blocks and queuing them.
 */
export const prepareSubdivision = () => {
  state.ants = [];
  state.recentRoads = [];
  state.processedShapeIndices = new Set();
  
  const MAX_AREA = state.settings.maxSubdivisionArea; 
  const MIN_AREA = state.settings.minSubdivisionArea;
  
  // Clear and populate queue with eligible indices
  state.subdivisionQueue = [];
  state.shapes.forEach((shape, index) => {
    const area = Math.abs(shape.getSignedArea());
    if (area >= MIN_AREA && area <= MAX_AREA) {
      state.subdivisionQueue.push(index);
    }
  });

  state.iteration++;
};

/**
 * Subdivides a single shape using the Transpose Grid approach.
 */
export const subdivideShape = (index: number): boolean => {
  const shape = state.shapes[index];
  if (!shape) return false;

  const snapThreshold = state.settings.enableSliverReduction 
    ? state.settings.subdivideSnap 
    : 0;

  const density = state.settings.subdivisionDensity || 1.0;
  const baseDist = state.settings.antTrailDistance;
  
  const baseScale = 3.5 + Math.random() * 5;
  const commonRatios = [1, 1, 1, 1.25, 1.5, 2, 0.5, 0.75, 0.8]; 
  const ratio = commonRatios[Math.floor(Math.random() * commonRatios.length)];

  const colSpacing = Math.max(12, (baseDist * baseScale) / density);
  const rowSpacing = Math.max(12, (baseDist * baseScale * ratio) / density);
  
  const localArterials = ArterialDetector.detectArterialsFromShapes([shape], 45);
  if (localArterials.length === 0) return false;

  const getPathLength = (p: Path2D) => p.toSegments().reduce((sum, seg) => sum + seg.length(), 0);
  
  let mainArt: Path2D = localArterials[0];
  let maxLength = -1;
  localArterials.forEach(art => {
    const l = getPathLength(art);
    if (l > maxLength) { maxLength = l; mainArt = art; }
  });

  const halfLen = maxLength / 2;
  let accumulated = 0;
  let midVertex = mainArt.points[0];
  const mainSegments = mainArt.toSegments();
  for (const seg of mainSegments) {
    const d = seg.length();
    if (accumulated + d >= halfLen) {
      const distToP1 = Math.abs(halfLen - accumulated);
      const distToP2 = Math.abs(halfLen - (accumulated + d));
      midVertex = distToP1 < distToP2 ? seg.p1 : seg.p2;
      break;
    }
    accumulated += d;
  }

  const vertexIndex = shape.points.findIndex(p => p.equals(midVertex));
  if (vertexIndex === -1) return false;

  const guideVector = shape.getInwardNormal(vertexIndex);
  const rotation = Math.atan2(guideVector.y, guideVector.x);

  const bounds = getPathBounds(shape.points);
  const center = new Vector2D((bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2);
  
  const w = (bounds.maxX - bounds.minX) * 1.5;
  const h = (bounds.maxY - bounds.minY) * 1.5;

  const rawGrid = TransposeGrid.generateRawGrid(
    center, 
    w, 
    h, 
    colSpacing, 
    rowSpacing, 
    rotation, 
    state.settings.subdivideWarp, 
    state.settings.subdivideRelax,
    state.flowField
  );
  const clippedGrid = TransposeGrid.clipGridToShape(rawGrid, shape, snapThreshold);

  // Update both collections
  state.recentRoads = clippedGrid;
  clippedGrid.forEach(seg => {
    state.roads.push(seg);
  });

  return true;
};

/**
 * Performs final global cleanup after all shapes are processed.
 */
export const finalizeSubdivision = () => {
  const snapThreshold = state.settings.subdivideSnap;

  if (state.elevation) {
    state.roads = TerrainCulling.cullSegments(state.roads, state.elevation, state.settings.terrainWaterLevel);
  }

  state.roads = RoadNetwork.cleanupNetwork(state.roads, snapThreshold);
  
  // Clear the visual highlight collection
  state.recentRoads = [];

  // Re-build shape spatial grid after any modifications to the infrastructure
  if (state.shapes.length > 0) {
    const grid = new ShapeSpatialGrid(120);
    state.shapes.forEach(s => grid.insert(s));
    state.shapeGrid = grid;
  }
  
  addEvent('subdivision_complete', [], new Vector2D(window.innerWidth/2, window.innerHeight/2), undefined, { 
    message: "Block subdivision complete via organic structural transpose grid." 
  });

  state.iteration++;
};