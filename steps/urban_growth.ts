
import { state, addEvent } from '../state/store';
import { Vector2D } from '../modules/Vector2D';
import { Ant } from '../modules/Ant';
import { Hub } from '../modules/Hub';
import { RoadPath } from '../modules/RoadPath';
import { RoadNetwork } from '../modules/RoadNetwork';
import { VisualizationSettings } from '../types';

export const stepInfo: { title: string, desc: string, vizTransitions: Partial<VisualizationSettings> } = {
  title: "Urban Growth Simulation",
  desc: "Dispatches steering agents. Multi-agent logic evolves roads via target-seeking, collision physics, and structural bridge building across water.",
  vizTransitions: {
    renderFlowField: true,
    renderHubs: false
  }
};

const getAvailableVertex = (hub: Hub): Vector2D | null => {
  const availableIndices = hub.shapePoints
    .map((_, i) => i)
    .filter(i => !hub.usedVertexIndices.has(i));

  if (availableIndices.length === 0) return null;

  const selectedIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  hub.usedVertexIndices.add(selectedIdx);
  return hub.shapePoints[selectedIdx];
};

export const spawnAntWave = () => {
  if (state.ants.some(a => a.isAlive)) {
    console.warn('Cannot spawn new wave: agents are still active.');
    return;
  }

  const newAnts: Ant[] = [];
  const globalTurnSpeed = state.settings.antTurnSpeed;
  const baseMaxLife = state.settings.antMaxLife;
  const baseTrailDistance = state.settings.antTrailDistance;
  const baseWanderIntensity = state.settings.antWanderIntensity;
  const intensity = state.settings.spawnIntensity;
  const snapDist = state.settings.antSnapDistance;
  const antsPerHub = Math.max(1, Math.round(state.settings.antsPerHub * intensity));
  const hubDirectness = state.settings.hubDirectness;
  const SIM_MARGIN = 50;
  const LONG_STRETCH_THRESHOLD = state.settings.minLongRoadLength;

  if (state.hubs.length < 1) return;

  const vertexMap = new Map<string, { count: number; other: Vector2D; pos: Vector2D }>();
  state.roads.forEach(seg => {
    [seg.p1, seg.p2].forEach((p, idx) => {
      const key = `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
      const entry = vertexMap.get(key) || { count: 0, other: (idx === 0 ? seg.p2 : seg.p1), pos: p };
      entry.count++;
      entry.other = idx === 0 ? seg.p2 : seg.p1;
      vertexMap.set(key, entry);
    });
  });

  // 1. Hub Spawning
  state.hubs.forEach(hub => {
    const otherHubs = state.hubs.filter(h => h.id !== hub.id);
    
    for (let i = 0; i < antsPerHub; i++) {
      const startPt = getAvailableVertex(hub);
      if (!startPt) break; 
      const targetHub = otherHubs.length > 0 ? otherHubs[Math.floor(Math.random() * otherHubs.length)] : hub;
      newAnts.push(new Ant(startPt.copy(), targetHub.position, {
        speed: 1.1 + Math.random() * 0.8,
        life: baseMaxLife * (0.8 + Math.random() * 0.4),
        turnSpeed: globalTurnSpeed * (0.8 + Math.random() * 0.4),
        trailDistance: Math.max(baseTrailDistance, snapDist * 1.5),
        originHubId: hub.id,
        wanderIntensity: baseWanderIntensity,
        isDirect: Math.random() < hubDirectness,
        type: 'hub',
        settings: state.settings
      }));
    }

    const carrierCount = state.settings.carrierCount;
    for (let i = 0; i < carrierCount; i++) {
      const startPt = getAvailableVertex(hub);
      if (!startPt) break;
      const targetHub = otherHubs.length > 0 ? otherHubs[Math.floor(Math.random() * otherHubs.length)] : hub;
      newAnts.push(new Ant(startPt.copy(), targetHub.position, {
        speed: 1.2,
        life: baseMaxLife * 2.5,
        turnSpeed: globalTurnSpeed * 0.1,
        trailDistance: Math.max(baseTrailDistance * 1.5, snapDist * 2.0),
        wanderIntensity: baseWanderIntensity * 0.1,
        type: 'carrier',
        settings: state.settings
      }));
    }

    const explorerCount = Math.max(2, Math.floor(antsPerHub * 0.7 * intensity));
    for (let i = 0; i < explorerCount; i++) {
      const startPt = getAvailableVertex(hub);
      if (!startPt) break;
      const dir = startPt.sub(hub.position).normalize();
      const farTarget = hub.position.add(dir.mul(5000));
      newAnts.push(new Ant(startPt.copy(), farTarget, {
        speed: 1.4,
        life: baseMaxLife * 1.5,
        turnSpeed: globalTurnSpeed * 0.05, 
        trailDistance: Math.max(baseTrailDistance * 1.2, snapDist * 1.8),
        wanderIntensity: baseWanderIntensity * 0.2,
        type: 'outward',
        settings: state.settings
      }));
    }

    // Ring Roads
    let ringIndex = 1;
    let currentRingProb = state.settings.ringRoadProbability;
    const baseRadius = hub.size * state.settings.ringRoadRadiusMultiplier;
    while (Math.random() < currentRingProb && ringIndex <= 3) {
      const radius = baseRadius * ringIndex;
      const ringCount = Math.max(1, Math.floor(antsPerHub * 0.6 * intensity));
      const clockwise = Math.random() > 0.5;
      for (let i = 0; i < ringCount; i++) {
        const startAngle = (i / ringCount) * Math.PI * 2 + (Math.random() * 0.3);
        const startPos = hub.position.add(new Vector2D(Math.cos(startAngle) * radius, Math.sin(startAngle) * radius));
        newAnts.push(new Ant(startPos, hub.position, {
          speed: 1.2,
          life: baseMaxLife * 2.5 * ringIndex,
          turnSpeed: 0,
          trailDistance: Math.max(15, baseTrailDistance * 2.5, snapDist * 2.5),
          wanderIntensity: baseWanderIntensity * 0.1,
          type: 'ring',
          ringCenter: hub.position,
          ringRadius: radius,
          ringClockwise: clockwise,
          settings: state.settings
        }));
      }
      ringIndex++;
      currentRingProb *= 0.5;
    }
  });

  // 2. Road Termination Spawning
  const terminations = Array.from(vertexMap.values()).filter(v => 
    v.count === 1 && 
    v.pos.x > SIM_MARGIN && v.pos.x < state.simWidth - SIM_MARGIN &&
    v.pos.y > SIM_MARGIN && v.pos.y < state.simHeight - SIM_MARGIN
  );
  
  const maxTerms = Math.floor(terminations.length * intensity * 0.5);
  const selectedTerms = terminations.sort(() => Math.random() - 0.5).slice(0, maxTerms);

  selectedTerms.forEach(term => {
    const forwardDir = term.pos.sub(term.other).normalize();
    const targetHub = state.hubs[Math.floor(Math.random() * state.hubs.length)];
    newAnts.push(new Ant(term.pos.copy(), targetHub.position, {
      speed: 1.2,
      life: baseMaxLife * 0.6,
      initialDirection: forwardDir,
      trailDistance: Math.max(baseTrailDistance, snapDist * 1.5),
      wanderIntensity: baseWanderIntensity * 0.4,
      type: 'termination',
      settings: state.settings
    }));
  });

  // 3. Perpendicular Spawning
  const allStretches = RoadPath.detectStretches(state.roads);
  const longStretches = allStretches.filter(path => path.length() > LONG_STRETCH_THRESHOLD);
  longStretches.forEach(path => {
    if (Math.random() > (0.5 * intensity)) return;
    const mid = path.midpoint();
    const midIdx = Math.floor(path.points.length / 2);
    const pPrev = path.points[Math.max(0, midIdx - 1)];
    const pNext = path.points[Math.min(path.points.length - 1, midIdx)];
    const dir = pNext.sub(pPrev).normalize();
    if (dir.mag() === 0) return;
    const side = Math.random() > 0.5 ? 1 : -1;
    const perpDir = new Vector2D(-dir.y * side, dir.x * side);
    const targetHub = state.hubs[Math.floor(Math.random() * state.hubs.length)];
    newAnts.push(new Ant(mid.copy(), targetHub.position, {
      speed: 1.3,
      life: baseMaxLife * 0.8,
      turnSpeed: globalTurnSpeed * 0.1,
      initialDirection: perpDir,
      trailDistance: Math.max(baseTrailDistance, snapDist * 1.5),
      wanderIntensity: 0.005, 
      type: 'perpendicular',
      settings: state.settings
    }));
  });

  // 4. Strategic Bridge Builder Spawning
  if (state.elevation && Math.random() < state.settings.bridgeProbability) {
    const waterLevel = state.settings.terrainWaterLevel;
    const maxBridgeLen = state.settings.maxBridgeLength;
    const MIN_BRIDGE_SEP = 350; 
    const MIN_LAKE_AREA_FOR_BRIDGE = 60000; 

    const isCrossingPermitted = (start: Vector2D, end: Vector2D): boolean => {
      const mid = start.add(end).div(2);
      const nearRiver = state.rivers.some(river => river.getInfluence(mid) > 0.05);
      if (nearRiver) return true;
      const waterBody = state.geography.waterBodies.find(wb => {
        const center = new Vector2D(wb.center.x, wb.center.y);
        const approxRadius = Math.sqrt(wb.area / Math.PI);
        return mid.dist(center) < approxRadius * 1.5;
      });
      if (waterBody && waterBody.area >= MIN_LAKE_AREA_FOR_BRIDGE) return true;
      return false;
    };
    
    const deadEndNearWater = Array.from(vertexMap.values()).filter(v => {
      if (v.count !== 1) return false;
      const h = state.elevation!.getHeight(v.pos.x, v.pos.y);
      return h >= waterLevel && h < waterLevel + 0.15;
    });

    deadEndNearWater.sort(() => Math.random() - 0.5).slice(0, 8).forEach(v => {
      const existingBridgeNearby = state.events.some(ev => 
        (ev.type === 'bridge_started' || ev.type === 'bridge_built') &&
        (ev.position.dist(v.pos) < MIN_BRIDGE_SEP || (ev.extraPos && ev.extraPos.dist(v.pos) < MIN_BRIDGE_SEP))
      );
      if (existingBridgeNearby) return;

      const samples = 16;
      let bestCrossing: { target: Vector2D, dir: Vector2D, dist: number, score: number } | null = null;
      let highestScore = -1;

      for (let i = 0; i < samples; i++) {
        const angle = (i / samples) * Math.PI * 2;
        const dir = new Vector2D(Math.cos(angle), Math.sin(angle));
        
        const nextStep = v.pos.add(dir.mul(10));
        if (state.elevation!.getHeight(nextStep.x, nextStep.y) < waterLevel) {
          for (let d = 40; d < maxBridgeLen; d += 20) {
            const checkPos = v.pos.add(dir.mul(d));
            if (checkPos.x < 0 || checkPos.x > state.simWidth || checkPos.y < 0 || checkPos.y > state.simHeight) break;
            
            const h = state.elevation!.getHeight(checkPos.x, checkPos.y);
            if (h >= waterLevel + 0.02) { 
              const landingConflict = state.events.some(ev => 
                (ev.type === 'bridge_started' || ev.type === 'bridge_built') &&
                (ev.position.dist(checkPos) < MIN_BRIDGE_SEP || (ev.extraPos && ev.extraPos.dist(checkPos) < MIN_BRIDGE_SEP))
              );
              if (landingConflict) break;
              if (!isCrossingPermitted(v.pos, checkPos)) break;

              let score = 100; 
              let nearestHubDist = Infinity;
              state.hubs.forEach(hub => {
                const dist = checkPos.dist(hub.position);
                if (dist < nearestHubDist) nearestHubDist = dist;
              });
              if (nearestHubDist < 400) score += (400 - nearestHubDist) * 2;
              let nearestOtherVertexDist = Infinity;
              terminations.forEach(term => {
                const dist = checkPos.dist(term.pos);
                if (dist < nearestOtherVertexDist) nearestOtherVertexDist = dist;
              });
              if (nearestOtherVertexDist < 150) score += (150 - nearestOtherVertexDist) * 3;
              else if (nearestOtherVertexDist < 40) score -= 50;
              score -= (d / maxBridgeLen) * 50;
              if (score > highestScore) {
                highestScore = score;
                bestCrossing = { target: checkPos, dir, dist: d, score };
              }
              break;
            }
          }
        }
      }

      if (bestCrossing && bestCrossing.score > 120) {
        addEvent('bridge_started', [], v.pos, bestCrossing.target, { message: `Linking to pocket (${Math.floor(bestCrossing.dist)}m)` });
        newAnts.push(new Ant(v.pos.copy(), bestCrossing.target, {
          type: 'bridge',
          speed: 1.8,
          life: 3000,
          turnSpeed: 0.001,
          trailDistance: Math.max(15, snapDist * 1.5),
          wanderIntensity: 0,
          initialDirection: bestCrossing.dir,
          settings: state.settings
        }));
      }
    });
  }

  // 5. Boundary Exit Spawning
  if (state.currentWave === 1) {
    state.exits.forEach(exit => {
      if (state.hubs.length === 0) return;
      const targetHub = state.hubs[Math.floor(Math.random() * state.hubs.length)];
      newAnts.push(new Ant(exit.copy(), targetHub.position, {
        speed: 1.4,
        life: baseMaxLife * 4.0, 
        turnSpeed: globalTurnSpeed * 0.2,
        // Boosted trail distance for exit ants to ensure they escape snapping radius and form long arterials
        trailDistance: Math.max(baseTrailDistance * 2.5, snapDist * 3.0),
        wanderIntensity: baseWanderIntensity * 0.2,
        type: 'termination',
        settings: state.settings
      }));
    });
  }

  state.ants = newAnts;
};

export const runUrbanGrowth = () => {
  if (state.hubs.length < 2) return;
  state.currentWave = 1;
  spawnAntWave();
  state.iteration++;
};
