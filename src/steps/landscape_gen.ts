import { state, resetEngine as resetState } from '../state/engine';
import { Vector2D } from '../modules/Vector2D';
import { TerrainFlowField } from '../modules/TerrainFlowField';
import { ElevationMap } from '../modules/ElevationMap';
import { ShorelineDetector } from '../modules/ShorelineDetector';
import { RiverGenerator } from '../modules/RiverGenerator';
import { River } from '../modules/River';
import { WaterBodyMetadata } from '../types';
import type { StepDefinition } from './types';

export const step: StepDefinition = {
  id: 'landscape',
  label: 'Geo',
  title: 'Landscape Synthesis',
  desc: 'Hard resets state. Generates noise-based topography, carves hydraulic riverbeds, and initializes the topography-aware vector flow field.',
  vizTransitions: {
    renderElevation: true,
    renderShorelines: false,
    renderFlowField: false,
    renderHubs: true,
  },
  hasSimControls: false,
  canReset: true,
  execute: () => { runLandscapeGen(); },
  isComplete: () => true,
};

/**
 * Landscape Generation: Hard reset and environmental setup.
 */
export const runLandscapeGen = () => {
  // Step 1 ALWAYS performs a hard reset
  resetState();

  const width = state.simWidth;
  const height = state.simHeight;
  const waterLevel = state.settings.terrainWaterLevel;

  // 1. Initialize Terrain Elevation
  const elevation = new ElevationMap(
    Math.random(), 
    state.settings.terrainScale
  );

  // 2. Procedural River Generation
  const riverCount = state.settings.riverCount || 2;
  const generatedRivers: River[] = [];
  
  const edges = [
    { side: 'top', bias: new Vector2D(0, 1) },
    { side: 'bottom', bias: new Vector2D(0, -1) },
    { side: 'left', bias: new Vector2D(1, 0) },
    { side: 'right', bias: new Vector2D(-1, 0) }
  ];

  for (let i = 0; i < riverCount; i++) {
    const edge = edges[Math.floor(Math.random() * edges.length)];
    let bestRiver: River | null = null;
    let maxLen = -1;

    for (let attempt = 0; attempt < 20; attempt++) {
      let startX = 0, startY = 0;
      if (edge.side === 'top') { startX = Math.random() * width; startY = 10; }
      else if (edge.side === 'bottom') { startX = Math.random() * width; startY = height - 10; }
      else if (edge.side === 'left') { startX = 10; startY = Math.random() * height; }
      else if (edge.side === 'right') { startX = width - 10; startY = Math.random() * height; }

      if (elevation.getHeight(startX, startY) > waterLevel + 0.1) {
        const testRiver = RiverGenerator.generate(
          elevation, 
          waterLevel, 
          new Vector2D(startX, startY), 
          8.0, 
          1000, 
          edge.bias.mul(0.5)
        );
        if (testRiver && testRiver.points.length > maxLen) {
          maxLen = testRiver.points.length;
          bestRiver = testRiver;
        }
      }
    }
    
    if (bestRiver) {
      bestRiver.width = 40 + Math.random() * 40;
      bestRiver.depth = 0.25 + Math.random() * 0.15;
      generatedRivers.push(bestRiver);
    }
  }

  elevation.setRivers(generatedRivers);
  state.rivers = generatedRivers;
  state.elevation = elevation;

  // 3. Extract Shoreline Boundary
  state.shorelines = ShorelineDetector.detect(
    state.elevation,
    state.settings.terrainWaterLevel,
    width,
    height,
    10, 
    0,
    0
  );

  // 4. Initialize Topography-Aware Flow Field
  const ffResolution = 15; 
  state.flowField = new TerrainFlowField(
    state.elevation,
    state.settings.terrainWaterLevel,
    width, 
    height, 
    ffResolution, 
    0, 
    0,
    state.settings.flowFieldScaleLarge,
    state.settings.flowFieldScaleSmall
  );

  // 5. Water Body Detection for metadata
  if (state.elevation) {
    const gridRes = 40; 
    const cols = Math.ceil(width / gridRes);
    const rows = Math.ceil(height / gridRes);
    const waterGrid: boolean[][] = [];
    const visited = new Set<string>();

    for (let x = 0; x < cols; x++) {
      waterGrid[x] = [];
      for (let y = 0; y < rows; y++) {
        const wx = x * gridRes + gridRes / 2;
        const wy = y * gridRes + gridRes / 2;
        waterGrid[x][y] = state.elevation.getHeight(wx, wy) < waterLevel;
      }
    }

    const waterBodies: WaterBodyMetadata[] = [];
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const key = `${x},${y}`;
        if (waterGrid[x][y] && !visited.has(key)) {
          const component: {x: number, y: number}[] = [];
          const queue = [{x, y}];
          visited.add(key);

          while (queue.length > 0) {
            const curr = queue.shift()!;
            component.push(curr);
            const neighbors = [
              {nx: curr.x + 1, ny: curr.y}, {nx: curr.x - 1, ny: curr.y},
              {nx: curr.x, ny: curr.y + 1}, {nx: curr.x, ny: curr.y - 1},
            ];
            for (const {nx, ny} of neighbors) {
              const nkey = `${nx},${ny}`;
              if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && waterGrid[nx][ny] && !visited.has(nkey)) {
                visited.add(nkey);
                queue.push({x: nx, y: ny});
              }
            }
          }
          const area = component.length * gridRes * gridRes;
          if (area > 5000) { 
            const avgX = (component.reduce((sum, p) => sum + p.x, 0) / component.length) * gridRes + gridRes/2;
            const avgY = (component.reduce((sum, p) => sum + p.y, 0) / component.length) * gridRes + gridRes/2;
            waterBodies.push({
              id: 'water-' + Math.random().toString(36).substr(2, 6),
              area,
              center: { x: avgX, y: avgY }
            });
          }
        }
      }
    }
    state.geography.waterBodies = waterBodies.sort((a, b) => b.area - a.area);
  }

  state.iteration++;
};