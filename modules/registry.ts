
import { ModuleDefinition } from '../types';
import VectorDemo from './Vector2D.demo';
import SegmentDemo from './Segment2D.demo.tsx';
import PathDemo from './Path2D.demo.tsx';
import ShapeDemo from './Shape2D.demo.tsx';
import ShapeDetectorDemo from './ShapeDetector.demo.tsx';
import HubDemo from './Hub.demo.tsx';
import AntDemo from './Ant.demo.tsx';
import RingAntDemo from './RingAnt.demo.tsx';
import RoadNetworkDemo from './RoadNetwork.demo.tsx';
import SubdividerDemo from './Subdivider.demo.tsx';
import ArterialDetectorDemo from './ArterialDetector.demo.tsx';
import ArterialStressDemo from './ArterialStress.demo.tsx';
import CullingDemo from './Culling.demo.tsx';
import FlowFieldDemo from './FlowField.demo.tsx';
import SpatialGridDemo from './SpatialGrid.demo.tsx';
import TransposeGridDemo from './TransposeGrid.demo.tsx';
import ShapeMergerDemo from './ShapeMerger.demo.tsx';
import ElevationMapDemo from './ElevationMap.demo.tsx';
import TerrainFlowFieldDemo from './TerrainFlowField.demo.tsx';
import ShorelineDetectorDemo from './ShorelineDetector.demo.tsx';
import RoadPathDemo from './RoadPath.demo.tsx';
import TerrainCullingDemo from './TerrainCulling.demo.tsx';
import CapsuleDemo from './Capsule2D.demo';
import CarrierDemo from './CarrierAnt.demo.tsx';
import RenderingConsistencyDemo from './RenderingConsistency.demo.tsx';
import PathfinderDemo from './Pathfinder.demo.tsx';
import ToponymyDemo from './Toponymy.demo.tsx';
import RiverDemo from './River.demo';
import ShapeSpatialGridDemo from './ShapeSpatialGrid.demo';
import LabelRelaxerDemo from './LabelRelaxer.demo';
import BridgeAntDemo from './BridgeAnt.demo';

// Tests have been migrated to Vitest — run `npm test` instead.
const vitest = async () => [{ name: 'Migrated to Vitest', passed: true }];

export const MODULES: ModuleDefinition[] = [
  {
    id: 'vector-2d',
    name: '2D Vector Library',
    description: 'A robust 2D vector class supporting basic arithmetic and spatial operations.',
    runTests: vitest,
    DemoComponent: VectorDemo
  },
  {
    id: 'bridge-ant',
    name: 'Bridge Builders',
    description: 'Specialized agents that detect shoreline proximity and construct spans across water barriers.',
    runTests: vitest,
    DemoComponent: BridgeAntDemo
  },
  {
    id: 'label-relaxer',
    name: 'Label Relaxation',
    description: 'Force-directed simulation to resolve overlaps between map text labels.',
    runTests: vitest,
    DemoComponent: LabelRelaxerDemo
  },
  {
    id: 'shape-spatial-grid',
    name: 'Shape Spatial Grid',
    description: 'Optimizes point-in-shape queries by pruning candidates using grid-based AABB overlap.',
    runTests: vitest,
    DemoComponent: ShapeSpatialGridDemo
  },
  {
    id: 'toponymy-ai',
    name: 'AI Toponymy',
    description: 'Uses Gemini to generate realistic, grounded names for city features based on spatial metadata.',
    runTests: vitest,
    DemoComponent: ToponymyDemo
  },
  {
    id: 'river-gen',
    name: 'Hydraulic River Gen',
    description: 'Algorithm to find steepest descent paths and carve them into elevation data.',
    runTests: vitest,
    DemoComponent: RiverDemo
  },
  {
    id: 'pathfinder',
    name: 'Terrain-Aware Pathfinder',
    description: 'A* algorithm for navigating road networks with cost multipliers based on topography gradient.',
    runTests: vitest,
    DemoComponent: PathfinderDemo
  },
  {
    id: 'render-consist',
    name: 'Rendering Consistency',
    description: 'Verifies that shape boundaries align perfectly with road segments without visual thickening.',
    runTests: vitest,
    DemoComponent: RenderingConsistencyDemo
  },
  {
    id: 'carrier-fork',
    name: 'Carrier & Forking',
    description: 'Orthogonal spawning logic for creating structural spines and rib-like road networks.',
    runTests: vitest,
    DemoComponent: CarrierDemo
  },
  {
    id: 'capsule-2d',
    name: 'Capsule Collision',
    description: 'Geometric primitive for swept-sphere collision detection, ideal for agents and corridors.',
    runTests: vitest,
    DemoComponent: CapsuleDemo
  },
  {
    id: 'spatial-grid',
    name: 'Spatial Partitioning',
    description: 'Optimizes proximity queries and collision detection via a uniform grid structure.',
    runTests: vitest,
    DemoComponent: SpatialGridDemo
  },
  {
    id: 'road-path',
    name: 'Road Paths & Corridors',
    description: 'Algorithm to extract long, non-forking stretches of road for hierarchical spawning.',
    runTests: vitest,
    DemoComponent: RoadPathDemo
  },
  {
    id: 'settings-registry',
    name: 'Simulation Settings',
    description: 'Verification of all simulation parameters and persistence logic.',
    runTests: vitest,
    DemoComponent: () => null 
  },
  {
    id: 'elevation-map',
    name: 'Topography & Elevation',
    description: 'Procedural terrain generation using fractal noise octaves for realistic landmasses.',
    runTests: vitest,
    DemoComponent: ElevationMapDemo
  },
  {
    id: 'terrain-culling',
    name: 'Terrain-Aware Culling',
    description: 'Geometric utility to prune segments and paths that are submerged or invalid based on elevation.',
    runTests: vitest,
    DemoComponent: TerrainCullingDemo
  },
  {
    id: 'flow-field',
    name: 'Flow Field',
    description: 'A noise-driven spatial grid of vectors providing organic steering forces.',
    runTests: vitest,
    DemoComponent: FlowFieldDemo
  },
  {
    id: 'terrain-flow',
    name: 'Terrain-Aware Flow',
    description: 'Advanced vector field that responds to topography: seeking valleys and avoiding water.',
    runTests: vitest,
    DemoComponent: TerrainFlowFieldDemo
  },
  {
    id: 'shoreline-detector',
    name: 'Shoreline Discovery',
    description: 'Uses Marching Squares to identify the exact vector boundary between land and water.',
    runTests: vitest,
    DemoComponent: ShorelineDetectorDemo
  },
  {
    id: 'culling',
    name: 'Spatial Culling',
    description: 'Tests for viewport intersection and rendering optimizations.',
    runTests: vitest,
    DemoComponent: CullingDemo
  },
  {
    id: 'segment-2d',
    name: 'Segment Logic',
    description: 'Linear geometry module for segments. Essential for road network generation.',
    runTests: vitest,
    DemoComponent: SegmentDemo
  },
  {
    id: 'path-2d',
    name: 'Path Collection',
    description: 'Higher-order geometry representing connected vectors.',
    runTests: vitest,
    DemoComponent: PathDemo
  },
  {
    id: 'shape-2d',
    name: 'Polygon & Shapes',
    description: 'Closed geometric shapes with winding order logic.',
    runTests: vitest,
    DemoComponent: ShapeDemo
  },
  {
    id: 'shape-detector',
    name: 'Shape Detection',
    description: 'Algorithm to discover enclosed polygons (city blocks) from raw road segments.',
    runTests: vitest,
    DemoComponent: ShapeDetectorDemo
  },
  {
    id: 'shape-merger',
    name: 'Shape Merging',
    description: 'Logic for combining adjacent blocks by identifying shared boundaries and reconciling paths.',
    runTests: vitest,
    DemoComponent: ShapeMergerDemo
  },
  {
    id: 'arterial-detector',
    name: 'Arterial Discovery',
    description: 'Identifies sequences of segments with minimal turns, acting as the "main paths" for development.',
    runTests: vitest,
    DemoComponent: ArterialDetectorDemo
  },
  {
    id: 'arterial-stress',
    name: 'Arterial Stress Tests',
    description: 'Visualizing detection behavior under extreme geometric conditions.',
    runTests: vitest,
    DemoComponent: ArterialStressDemo
  },
  {
    id: 'hub',
    name: 'Urban Hubs',
    description: 'Points of urban intensity that drive street and building generation.',
    runTests: vitest,
    DemoComponent: HubDemo
  },
  {
    id: 'ant',
    name: 'Autonomous Ants',
    description: 'Dynamic agents that navigate between hubs, forming the basis for traffic simulation.',
    runTests: vitest,
    DemoComponent: AntDemo
  },
  {
    id: 'ring-ant',
    name: 'Orbital Ring Ants',
    description: 'Specialized agents for generating concentric beltways around urban hubs.',
    runTests: vitest,
    DemoComponent: RingAntDemo
  },
  {
    id: 'road-network',
    name: 'Road Network',
    description: 'A collection of segments representing the city infrastructure.',
    runTests: vitest,
    DemoComponent: RoadNetworkDemo
  },
  {
    id: 'subdivider',
    name: 'Block Subdivision',
    description: 'Calculates inward-facing trajectories for creating internal block grids.',
    runTests: vitest,
    DemoComponent: SubdividerDemo
  },
  {
    id: 'transpose-grid',
    name: 'Transpose Grid',
    description: 'Geometric clipping logic that overlays a procedural grid onto arbitrary shapes.',
    runTests: vitest,
    DemoComponent: TransposeGridDemo
  }
];
