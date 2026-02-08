
import { state, addEvent } from '../state/engine';
import { ShapeDetector } from '../modules/ShapeDetector';
import { ShapeMerger } from '../modules/ShapeMerger';
import { ArterialDetector } from '../modules/ArterialDetector';
import { TerrainCulling } from '../modules/TerrainCulling';
import { Vector2D } from '../modules/Vector2D';
import { profile } from '../utils/Profiler';
import { NotableShapeMetadata, VisualizationSettings, BridgeMetadata } from '../types';
import { ShapeSpatialGrid } from '../modules/ShapeSpatialGrid';
import { Segment2D } from '../modules/Segment2D';

export const stepInfo: { title: string, desc: string, vizTransitions: Partial<VisualizationSettings> } = {
  title: "Structural Discovery",
  desc: "Runs graph-based shape detection to identify enclosed city blocks. Extracts bridge infrastructure from the network and identifies primary arterial axes.",
  vizTransitions: {
    renderFlowField: false,
    renderShorelines: true,
    renderElevation: false
  }
};

/**
 * Groups connected segments marked as bridges into unified bridge infrastructure objects.
 */
const detectBridgesFromRoads = (roads: Segment2D[]): BridgeMetadata[] => {
  const bridgeSegments = roads.filter(r => r.isBridge);
  if (bridgeSegments.length === 0) return [];

  const visited = new Set<Segment2D>();
  const bridgeGroups: Segment2D[][] = [];

  for (const seg of bridgeSegments) {
    if (visited.has(seg)) continue;

    const group: Segment2D[] = [];
    const queue: Segment2D[] = [seg];
    visited.add(seg);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      group.push(curr);

      for (const other of bridgeSegments) {
        if (visited.has(other)) continue;
        if (curr.sharesVertex(other)) {
          visited.add(other);
          queue.push(other);
        }
      }
    }
    bridgeGroups.push(group);
  }

  return bridgeGroups.map((group, idx) => {
    let totalLen = 0;
    let sumX = 0;
    let sumY = 0;
    
    group.forEach(s => {
      totalLen += s.length();
      const mid = s.midpoint();
      sumX += mid.x;
      sumY += mid.y;
    });

    return {
      id: `bridge-${Math.random().toString(36).substr(2, 4)}-${idx}`,
      midpoint: { x: sumX / group.length, y: sumY / group.length },
      length: totalLen
    };
  });
};

/**
 * Structural Discovery: Block detection, Axis refinement, and Bridge extraction.
 */
export const runStructuralAnalysis = () => {
  if (state.roads.length < 3) {
    console.warn('Need at least 3 segments to form a shape.');
    return;
  }

  if (state.elevation) {
    state.roads = TerrainCulling.cullSegments(state.roads, state.elevation, state.settings.terrainWaterLevel);
  }

  // 1. Detect and Merge Shapes
  const rawShapes = profile('ShapeDetector.detectShapes', () => ShapeDetector.detectShapes(state.roads));
  const initialCount = rawShapes.length;

  const mergeThreshold = state.settings.mergeAreaThreshold;
  const refinedShapes = profile('ShapeMerger.runAutoMerge', () => ShapeMerger.runAutoMerge(rawShapes, mergeThreshold));
  state.shapes = refinedShapes;

  // 2. Discover Bridges from the graph
  const discoveredBridges = profile('BridgeDiscovery.run', () => detectBridgesFromRoads(state.roads));
  state.geography.bridges = discoveredBridges;

  // 3. Build optimized spatial lookup grid
  profile('ShapeSpatialGrid.rebuild', () => {
    const grid = new ShapeSpatialGrid(120);
    refinedShapes.forEach(s => grid.insert(s));
    state.shapeGrid = grid;
  });

  if (initialCount > 0) {
    addEvent('shapes_detected', [], new Vector2D(state.simWidth / 2, state.simHeight / 2), undefined, { 
      count: initialCount,
      message: `Discovered ${initialCount} blocks and ${discoveredBridges.length} bridge spans.`
    });
  }

  // 4. Extract Notable Districts for Naming
  const notableAreaThreshold = 10000;
  const maxSubdivArea = state.settings.maxSubdivisionArea;

  const notable: NotableShapeMetadata[] = state.shapes
    .filter(s => Math.abs(s.getSignedArea()) > notableAreaThreshold)
    .map(s => {
      const area = Math.abs(s.getSignedArea());
      const pts = s.points;
      const center = pts.reduce((acc, p) => acc.add(p), new Vector2D(0, 0)).div(pts.length);
      
      let nearestHubId: string | null = null;
      let minDist = Infinity;
      state.hubs.forEach(h => {
        const d = center.dist(h.position);
        if (d < minDist) { minDist = d; nearestHubId = h.id; }
      });

      return {
        id: Math.random().toString(36).substr(2, 6),
        type: area > maxSubdivArea ? 'nature_space' : 'urban_district',
        area,
        center: { x: center.x, y: center.y },
        distToNearestHub: minDist,
        nearestHubId,
      } satisfies NotableShapeMetadata;
    })
    .sort((a, b) => b.area - a.area);

  state.geography.notableShapes = notable;

  // 5. Arterial Discovery
  const detectedArterials = profile('ArterialDetector.detectArterials', () => ArterialDetector.detectArterialsFromShapes(refinedShapes, 50));
  state.arterials = detectedArterials;
  
  state.iteration++;
};
