/**
 * Ant simulation helpers.
 *
 * Contains the spatial-grid management, collision detection, and
 * per-ant processing logic that was previously inlined in engine.ts.
 */

import { state, addEvent } from '../state/engine';
import { Vector2D } from '../modules/Vector2D';
import { Ant } from '../modules/Ant';
import { Segment2D } from '../modules/Segment2D';
import { SpatialGrid } from '../modules/SpatialGrid';
import { RoadNetwork } from '../modules/RoadNetwork';
import { Capsule2D } from '../modules/Capsule2D';
import { profile } from '../utils/Profiler';

// ── Spatial grids ─────────────────────────────────────────────────────

let spatialGrid: SpatialGrid<Vector2D> | null = null;
let antGrid: SpatialGrid<Ant> | null = null;
let roadGrid: SpatialGrid<Segment2D> | null = null;
let lastRoadCount = -1;

export function resetSpatialGrids(): void {
  spatialGrid = null;
  antGrid = null;
  roadGrid = null;
  lastRoadCount = -1;
}

export function syncRoadGrid(force = false): void {
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

export function syncAntGrid(): void {
  const gridSize = Math.max(20, state.settings.antAttractionRadius);
  const grid = new SpatialGrid<Ant>(gridSize);
  state.ants.forEach((a) => { if (a.isAlive) grid.insert(a.position, a); });
  antGrid = grid;
}

// ── Collision helpers ─────────────────────────────────────────────────

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

// ── Per-ant processing ────────────────────────────────────────────────

export function checkCollisions(): void {
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

export function processAnt(ant: Ant): void {
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
