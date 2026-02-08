import engine, { state } from '../state/engine';
import { Vector2D } from '../modules/Vector2D';
import { Hub } from '../modules/Hub';
import { RoadNetwork } from '../modules/RoadNetwork';
import { TerrainCulling } from '../modules/TerrainCulling';
import { ShapeDetector } from '../modules/ShapeDetector';
import { ArterialDetector } from '../modules/ArterialDetector';
import type { StepDefinition } from './types';

export const step: StepDefinition = {
  id: 'infrastructure',
  label: 'Hubs',
  title: 'Infrastructure Seating',
  desc: 'Analyzes terrain height to seat urban hubs and boundary transit exits. Hubs appear sequentially from primary Tier 1 centers down to local hubs.',
  vizTransitions: {
    renderElevation: false,
    renderShorelines: true,
  },
  hasSimControls: false,
  execute: () => {
    runInfrastructureGen();
    placeAllHubs();
    finishHubPhase();
    engine.tick();
  },
  isComplete: () => true,
};

/**
 * Drain hubQueue into state.hubs with staggered spawnTimes for animation,
 * add road segments and geography metadata.
 */
function placeAllHubs(): void {
  const now = Date.now();
  let i = 0;
  while (state.hubQueue.length > 0) {
    const hub = state.hubQueue.shift();
    if (!hub) continue;
    hub.spawnTime = now + i * 300;
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
      id: hub.id,
      position: { x: hub.position.x, y: hub.position.y },
      size: hub.size,
      tier: hub.tier,
      distToWater: minDist,
    });
    i++;
  }
}

/**
 * Post-hub terrain culling, shape detection, and arterial detection.
 */
function finishHubPhase(): void {
  if (state.elevation) {
    state.roads = TerrainCulling.cullSegments(state.roads, state.elevation, state.settings.terrainWaterLevel);
  }
  const detectedShapes = ShapeDetector.detectShapes(state.roads);
  state.shapes = detectedShapes;
  if (detectedShapes.length > 0) {
    state.arterials = ArterialDetector.detectArterialsFromShapes(detectedShapes, 45);
  }
}

/**
 * Infrastructure Placement: Hubs and Exits.
 * Instead of adding to state.hubs immediately, populates state.hubQueue.
 */
export const runInfrastructureGen = () => {
  if (!state.elevation) return;

  const width = state.simWidth;
  const height = state.simHeight;
  const targetCount = state.settings.hubCount;
  const waterLevel = state.settings.terrainWaterLevel;
  const padding = 150;

  // Clear existing staged infrastructure
  state.hubs = [];
  state.hubQueue = [];
  state.exits = [];
  state.geography.hubs = [];

  // 1. Generate Edge Exits (These appear immediately)
  const createExits = (side: 'top' | 'bottom' | 'left' | 'right') => {
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 1; i <= count; i++) {
      const frac = i / (count + 1);
      let x = 0, y = 0;
      if (side === 'top') { x = width * frac; y = 0; }
      if (side === 'bottom') { x = width * frac; y = height; }
      if (side === 'left') { x = 0; y = height * frac; }
      if (side === 'right') { x = width; y = height * frac; }
      
      if (state.elevation && state.elevation.getHeight(x, y) >= waterLevel) {
        state.exits.push(new Vector2D(x, y));
      }
    }
  };

  createExits('top'); createExits('bottom'); createExits('left'); createExits('right');

  // 2. Hub Candidate Calculation
  // Increased ratio for Tier 1 hubs and added a small random offset to allow chance of multiple primary centers
  const t1Ratio = 0.15 + (Math.random() * 0.2); // 15% to 35% chance for Tier 1
  const t1Count = Math.max(1, Math.floor(targetCount * t1Ratio));
  const t2Count = Math.max(1, Math.floor(targetCount * 0.35));
  const t3Count = Math.max(1, targetCount - t1Count - t2Count);

  const localHubPool: Hub[] = [];

  const placeHub = (tier: number, sizeRange: [number, number], parent?: Hub): boolean => {
    let bestX = 0, bestY = 0, bestScore = -Infinity, foundAny = false;
    const candidateCount = parent ? 15 : 60; // Increased search depth for primary centers
    
    for (let i = 0; i < candidateCount; i++) {
      let x, y;
      if (!parent) {
        x = padding + Math.random() * (width - padding * 2);
        y = padding + Math.random() * (height - padding * 2);
      } else {
        const angle = Math.random() * Math.PI * 2;
        const dist = parent.size * (2.5 + Math.random() * 4.0) + (tier === 3 ? 50 : 150);
        x = parent.position.x + Math.cos(angle) * dist;
        y = parent.position.y + Math.sin(angle) * dist;
      }

      x = Math.max(padding, Math.min(width - padding, x));
      y = Math.max(padding, Math.min(height - padding, y));

      if (state.elevation) {
        const h = state.elevation.getHeight(x, y);
        if (h < waterLevel + 0.01) continue; 

        let score = 0;
        const distToWater = h - waterLevel;
        // Preference for "harbor" or "river-side" seating
        if (distToWater < 0.15) score += (1.0 - (distToWater / 0.15)) * 500;

        let minDist = Infinity;
        localHubPool.forEach(h => {
          const d = new Vector2D(x, y).dist(h.position);
          if (d < minDist) minDist = d;
        });

        // Spaced "quite some distance" for Tier 1 (800 units minimum ideal separation)
        const targetSpacing = tier === 1 ? 800 : 200;
        if (minDist < targetSpacing) score -= (1.0 - minDist / targetSpacing) * 2000;
        else score += Math.min(minDist, 1000) * 0.2;

        if (score > bestScore) {
          bestScore = score; bestX = x; bestY = y; foundAny = true;
        }
      }
    }

    if (!foundAny) return false;

    const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
    const newHub = new Hub(new Vector2D(bestX, bestY), size, tier);
    
    // Hard rejection for primary centers that are too close
    if (tier === 1 && localHubPool.some(h => h.tier === 1 && h.position.dist(newHub.position) < 600)) return false;
    if (localHubPool.some(h => h.overlaps(newHub)) && tier === 1) return false;

    const vertexCount = (tier === 1 ? 7 : tier === 2 ? 5 : 4) + Math.floor(Math.random() * 3);
    const coreRadius = Math.max(12, size * 0.35);
    for (let v = 0; v < vertexCount; v++) {
      const angle = (v / vertexCount) * Math.PI * 2;
      const pt = new Vector2D(newHub.position.x + Math.cos(angle) * coreRadius, newHub.position.y + Math.sin(angle) * coreRadius);
      newHub.shapePoints.push(pt);
    }

    localHubPool.push(newHub);
    return true;
  };

  // Run placement logic Tier by Tier
  for (let i = 0; i < t1Count; i++) placeHub(1, [90, 140]);
  const t1 = localHubPool.filter(h => h.tier === 1);
  if (t1.length > 0) for (let i = 0; i < t2Count; i++) placeHub(2, [45, 75], t1[i % t1.length]);
  const t12 = localHubPool.filter(h => h.tier <= 2);
  if (t12.length > 0) for (let i = 0; i < t3Count; i++) placeHub(3, [20, 35], t12[i % t12.length]);

  // Stage in the queue sorted by Tier (Largest/Primary first)
  state.hubQueue = [...localHubPool].sort((a, b) => a.tier - b.tier);

  state.iteration++;
};
