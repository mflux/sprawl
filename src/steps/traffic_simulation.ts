import { state, addEvent } from '../state/store';
import { Vector2D } from '../modules/Vector2D';
import { Pathfinder } from '../modules/Pathfinder';
import { Hub } from '../modules/Hub';
import { RoadNetwork } from '../modules/RoadNetwork';
import { profile } from '../utils/Profiler';
import { VisualizationSettings } from '../types';

export const stepInfo: { title: string, desc: string, vizTransitions: Partial<VisualizationSettings> } = {
  title: "Traffic Analysis",
  desc: "Simulates thousands of A* pathfinding trips between hubs and exits to generate an infrastructure usage heatmap.",
  vizTransitions: {
    renderTraffic: true
  }
};

/**
 * Road Usage Simulation: Picks trips and records segment usage.
 */
export const runTrafficSimulation = (): boolean => {
  const maxTrips = state.settings.maxTrafficTrips || 400;
  
  if (state.usageCount >= maxTrips) {
    state.activePath = null;
    return false;
  }

  if (state.hubs.length < 2 || state.roads.length === 0) {
    state.activePath = null;
    return false;
  }

  if (state.usageCount === 0) {
    state.exits.forEach(exit => {
      const nearest = RoadNetwork.findNearestVertex(exit, state.roads, 500); 
      if (nearest) {
        RoadNetwork.addSegmentSnapped(exit, nearest, state.roads, 5);
      }
    });
  }

  const getWeight = (hub: Hub) => hub.size * hub.tier;
  const totalHubWeight = state.hubs.reduce((acc, h) => acc + getWeight(h), 0);
  const exitWeight = 60;
  const totalWeight = totalHubWeight + (state.exits.length * exitWeight);

  const pickWeightedDestination = (): Vector2D => {
    let r = Math.random() * totalWeight;
    for (const hub of state.hubs) {
      r -= getWeight(hub);
      if (r <= 0) return hub.position;
    }
    for (const exit of state.exits) {
      r -= exitWeight;
      if (r <= 0) return exit;
    }
    return state.hubs[0].position;
  };

  const startPos = pickWeightedDestination();
  let endPos = pickWeightedDestination();
  let safety = 0;
  while (startPos.equals(endPos) && safety < 10) {
    endPos = pickWeightedDestination();
    safety++;
  }

  const path = profile('Pathfinder.findPath', () => 
    Pathfinder.findPath(startPos, endPos, state.roads, state.elevation, 15)
  );

  state.activePath = path;

  if (path && path.length > 1) {
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      const k1 = `${p1.x.toFixed(2)},${p1.y.toFixed(2)}`;
      const k2 = `${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
      const key = k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
      const current = state.usageMap.get(key) || 0;
      state.usageMap.set(key, current + 1);
    }

    state.usageCount++;

    if (state.usageCount % 10 === 0 || state.usageCount === maxTrips) {
      addEvent('traffic_simulated', [], startPos, endPos, {
        message: `Traffic Analysis: ${state.usageCount}/${maxTrips} samples collected.`
      });
    }
  }

  return state.usageCount < maxTrips;
};