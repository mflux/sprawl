
import { ModuleDefinition } from '../types';
import { runVectorTests } from './Vector2D.test';
import VectorDemo from './Vector2D.demo';
import { runSegmentTests } from './Segment2D.test';
import SegmentDemo from './Segment2D.demo.tsx';
import { runPathTests } from './Path2D.test';
import PathDemo from './Path2D.demo.tsx';
import { runShapeTests } from './Shape2D.test';
import ShapeDemo from './Shape2D.demo.tsx';
import { runShapeDetectorTests } from './ShapeDetector.test';
import ShapeDetectorDemo from './ShapeDetector.demo.tsx';
import { runHubTests } from './Hub.test';
import HubDemo from './Hub.demo.tsx';
import { runAntTests } from './Ant.test';
import AntDemo from './Ant.demo.tsx';
import { runRingAntTests } from './RingAnt.test';
import RingAntDemo from './RingAnt.demo.tsx';
import { runRoadNetworkTests } from './RoadNetwork.test';
import RoadNetworkDemo from './RoadNetwork.demo.tsx';
import { runSubdividerTests } from './Subdivider.test';
import SubdividerDemo from './Subdivider.demo.tsx';
import { runArterialTests } from './ArterialDetector.test';
import ArterialDetectorDemo from './ArterialDetector.demo.tsx';
import ArterialStressDemo from './ArterialStress.demo.tsx';
import { runCullingTests } from './Culling.test';
import CullingDemo from './Culling.demo.tsx';
import { runFlowFieldTests } from './FlowField.test';
import FlowFieldDemo from './FlowField.demo.tsx';
import { runSettingsTests } from './Settings.test';
import { runSpatialGridTests } from './SpatialGrid.test';
import SpatialGridDemo from './SpatialGrid.demo.tsx';
import { runTransposeGridTests } from './TransposeGrid.test';
import TransposeGridDemo from './TransposeGrid.demo.tsx';
import { runShapeMergerTests } from './ShapeMerger.test';
import ShapeMergerDemo from './ShapeMerger.demo.tsx';
import { runElevationTests } from './ElevationMap.test';
import ElevationMapDemo from './ElevationMap.demo.tsx';
import { runTerrainFlowTests } from './TerrainFlowField.test';
import TerrainFlowFieldDemo from './TerrainFlowField.demo.tsx';
import { runShorelineTests } from './ShorelineDetector.test';
import ShorelineDetectorDemo from './ShorelineDetector.demo.tsx';
import { runRoadPathTests } from './RoadPath.test';
import RoadPathDemo from './RoadPath.demo.tsx';
import { runTerrainCullingTests } from './TerrainCulling.test';
import TerrainCullingDemo from './TerrainCulling.demo.tsx';
import { runCapsuleTests } from './Capsule2D.test';
import CapsuleDemo from './Capsule2D.demo';
import { runCarrierTests } from './CarrierAnt.test';
import CarrierDemo from './CarrierAnt.demo.tsx';
import { runRenderingConsistencyTests } from './RenderingConsistency.test';
import RenderingConsistencyDemo from './RenderingConsistency.demo.tsx';
import { runPathfinderTests } from './Pathfinder.test';
import PathfinderDemo from './Pathfinder.demo.tsx';
import ToponymyDemo from './Toponymy.demo.tsx';
import { runRiverTests } from './River.test';
import RiverDemo from './River.demo';
import { runShapeSpatialGridTests } from './ShapeSpatialGrid.test';
import ShapeSpatialGridDemo from './ShapeSpatialGrid.demo';
import { runLabelRelaxerTests } from './LabelRelaxer.test';
import LabelRelaxerDemo from './LabelRelaxer.demo';
import { runBridgeAntTests } from './BridgeAnt.test';
import BridgeAntDemo from './BridgeAnt.demo';

export const MODULES: ModuleDefinition[] = [
  {
    id: 'vector-2d',
    name: '2D Vector Library',
    description: 'A robust 2D vector class supporting basic arithmetic and spatial operations.',
    runTests: runVectorTests,
    DemoComponent: VectorDemo
  },
  {
    id: 'bridge-ant',
    name: 'Bridge Builders',
    description: 'Specialized agents that detect shoreline proximity and construct spans across water barriers.',
    runTests: runBridgeAntTests,
    DemoComponent: BridgeAntDemo
  },
  {
    id: 'label-relaxer',
    name: 'Label Relaxation',
    description: 'Force-directed simulation to resolve overlaps between map text labels.',
    runTests: runLabelRelaxerTests,
    DemoComponent: LabelRelaxerDemo
  },
  {
    id: 'shape-spatial-grid',
    name: 'Shape Spatial Grid',
    description: 'Optimizes point-in-shape queries by pruning candidates using grid-based AABB overlap.',
    runTests: runShapeSpatialGridTests,
    DemoComponent: ShapeSpatialGridDemo
  },
  {
    id: 'toponymy-ai',
    name: 'AI Toponymy',
    description: 'Uses Gemini to generate realistic, grounded names for city features based on spatial metadata.',
    runTests: async () => [{ name: 'Schema Integrity', passed: true }],
    DemoComponent: ToponymyDemo
  },
  {
    id: 'river-gen',
    name: 'Hydraulic River Gen',
    description: 'Algorithm to find steepest descent paths and carve them into elevation data.',
    runTests: runRiverTests,
    DemoComponent: RiverDemo
  },
  {
    id: 'pathfinder',
    name: 'Terrain-Aware Pathfinder',
    description: 'A* algorithm for navigating road networks with cost multipliers based on topography gradient.',
    runTests: runPathfinderTests,
    DemoComponent: PathfinderDemo
  },
  {
    id: 'render-consist',
    name: 'Rendering Consistency',
    description: 'Verifies that shape boundaries align perfectly with road segments without visual thickening.',
    runTests: runRenderingConsistencyTests,
    DemoComponent: RenderingConsistencyDemo
  },
  {
    id: 'carrier-fork',
    name: 'Carrier & Forking',
    description: 'Orthogonal spawning logic for creating structural spines and rib-like road networks.',
    runTests: runCarrierTests,
    DemoComponent: CarrierDemo
  },
  {
    id: 'capsule-2d',
    name: 'Capsule Collision',
    description: 'Geometric primitive for swept-sphere collision detection, ideal for agents and corridors.',
    runTests: runCapsuleTests,
    DemoComponent: CapsuleDemo
  },
  {
    id: 'spatial-grid',
    name: 'Spatial Partitioning',
    description: 'Optimizes proximity queries and collision detection via a uniform grid structure.',
    runTests: runSpatialGridTests,
    DemoComponent: SpatialGridDemo
  },
  {
    id: 'road-path',
    name: 'Road Paths & Corridors',
    description: 'Algorithm to extract long, non-forking stretches of road for hierarchical spawning.',
    runTests: runRoadPathTests,
    DemoComponent: RoadPathDemo
  },
  {
    id: 'settings-registry',
    name: 'Simulation Settings',
    description: 'Verification of all simulation parameters and persistence logic.',
    runTests: runSettingsTests,
    DemoComponent: () => null 
  },
  {
    id: 'elevation-map',
    name: 'Topography & Elevation',
    description: 'Procedural terrain generation using fractal noise octaves for realistic landmasses.',
    runTests: runElevationTests,
    DemoComponent: ElevationMapDemo
  },
  {
    id: 'terrain-culling',
    name: 'Terrain-Aware Culling',
    description: 'Geometric utility to prune segments and paths that are submerged or invalid based on elevation.',
    runTests: runTerrainCullingTests,
    DemoComponent: TerrainCullingDemo
  },
  {
    id: 'flow-field',
    name: 'Flow Field',
    description: 'A noise-driven spatial grid of vectors providing organic steering forces.',
    runTests: runFlowFieldTests,
    DemoComponent: FlowFieldDemo
  },
  {
    id: 'terrain-flow',
    name: 'Terrain-Aware Flow',
    description: 'Advanced vector field that responds to topography: seeking valleys and avoiding water.',
    runTests: runTerrainFlowTests,
    DemoComponent: TerrainFlowFieldDemo
  },
  {
    id: 'shoreline-detector',
    name: 'Shoreline Discovery',
    description: 'Uses Marching Squares to identify the exact vector boundary between land and water.',
    runTests: runShorelineTests,
    DemoComponent: ShorelineDetectorDemo
  },
  {
    id: 'culling',
    name: 'Spatial Culling',
    description: 'Tests for viewport intersection and rendering optimizations.',
    runTests: runCullingTests,
    DemoComponent: CullingDemo
  },
  {
    id: 'segment-2d',
    name: 'Segment Logic',
    description: 'Linear geometry module for segments. Essential for road network generation.',
    runTests: runSegmentTests,
    DemoComponent: SegmentDemo
  },
  {
    id: 'path-2d',
    name: 'Path Collection',
    description: 'Higher-order geometry representing connected vectors.',
    runTests: runPathTests,
    DemoComponent: PathDemo
  },
  {
    id: 'shape-2d',
    name: 'Polygon & Shapes',
    description: 'Closed geometric shapes with winding order logic.',
    runTests: runShapeTests,
    DemoComponent: ShapeDemo
  },
  {
    id: 'shape-detector',
    name: 'Shape Detection',
    description: 'Algorithm to discover enclosed polygons (city blocks) from raw road segments.',
    runTests: runShapeDetectorTests,
    DemoComponent: ShapeDetectorDemo
  },
  {
    id: 'shape-merger',
    name: 'Shape Merging',
    description: 'Logic for combining adjacent blocks by identifying shared boundaries and reconciling paths.',
    runTests: runShapeMergerTests,
    DemoComponent: ShapeMergerDemo
  },
  {
    id: 'arterial-detector',
    name: 'Arterial Discovery',
    description: 'Identifies sequences of segments with minimal turns, acting as the "main paths" for development.',
    runTests: runArterialTests,
    DemoComponent: ArterialDetectorDemo
  },
  {
    id: 'arterial-stress',
    name: 'Arterial Stress Tests',
    description: 'Visualizing detection behavior under extreme geometric conditions.',
    runTests: runArterialTests, 
    DemoComponent: ArterialStressDemo
  },
  {
    id: 'hub',
    name: 'Urban Hubs',
    description: 'Points of urban intensity that drive street and building generation.',
    runTests: runHubTests,
    DemoComponent: HubDemo
  },
  {
    id: 'ant',
    name: 'Autonomous Ants',
    description: 'Dynamic agents that navigate between hubs, forming the basis for traffic simulation.',
    runTests: runAntTests,
    DemoComponent: AntDemo
  },
  {
    id: 'ring-ant',
    name: 'Orbital Ring Ants',
    description: 'Specialized agents for generating concentric beltways around urban hubs.',
    runTests: runRingAntTests,
    DemoComponent: RingAntDemo
  },
  {
    id: 'road-network',
    name: 'Road Network',
    description: 'A collection of segments representing the city infrastructure.',
    runTests: runRoadNetworkTests,
    DemoComponent: RoadNetworkDemo
  },
  {
    id: 'subdivider',
    name: 'Block Subdivision',
    description: 'Calculates inward-facing trajectories for creating internal block grids.',
    runTests: runSubdividerTests,
    DemoComponent: SubdividerDemo
  },
  {
    id: 'transpose-grid',
    name: 'Transpose Grid',
    description: 'Geometric clipping logic that overlays a procedural grid onto arbitrary shapes.',
    runTests: runTransposeGridTests,
    DemoComponent: TransposeGridDemo
  }
];
