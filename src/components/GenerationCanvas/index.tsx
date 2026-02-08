
import React, { useEffect, useRef } from 'react';
import engine from '../../state/engine';
import * as Drawers from './drawers';
import { STEPS } from '../../steps/registry';
import { createInitialTransform, centerTransform, attachCanvasControls } from './useCanvasControls';
import { useElevationBaking } from './useElevationBaking';

import p5 from 'p5';

interface GenerationCanvasProps {
  activeStep: number;
}

export const GenerationCanvas: React.FC<GenerationCanvasProps> = ({ activeStep }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const activeStepRef = useRef<number>(activeStep);

  const elevationGraphicsRef = useRef<p5.Graphics | null>(null);

  const lastFlowFieldRef = useRef<unknown>(null);
  const lastShorelineRef = useRef<unknown>(null);
  const lastShapesCountRef = useRef<number>(0);
  const lastArterialsCountRef = useRef<number>(0);
  const lastRoadsCountRef = useRef<number>(0);

  const flowGraphicsRef = useRef<p5.Graphics | null>(null);
  const shorelineInteriorGraphicsRef = useRef<p5.Graphics | null>(null);
  const shorelineEdgeGraphicsRef = useRef<p5.Graphics | null>(null);
  const shapesGraphicsRef = useRef<p5.Graphics | null>(null);
  const arterialsGraphicsRef = useRef<p5.Graphics | null>(null);
  const roadsGraphicsRef = useRef<p5.Graphics | null>(null);

  const lastResetHandledRef = useRef<number>(0);

  // Event-driven elevation baking (subscribes to engine state changes)
  const { resetState: resetElevationState } = useElevationBaking(
    p5Instance,
    elevationGraphicsRef,
    STEPS
  );

  // Handle engine state resets (clear graphics caches)
  useEffect(() => {
    const unsubscribe = engine.subscribe(() => {
      const s = engine.state;
      if (s.lastReset > lastResetHandledRef.current) {
        lastResetHandledRef.current = s.lastReset;
        if (shapesGraphicsRef.current) shapesGraphicsRef.current.clear();
        if (arterialsGraphicsRef.current) arterialsGraphicsRef.current.clear();
        if (roadsGraphicsRef.current) roadsGraphicsRef.current.clear();
        resetElevationState();
        lastFlowFieldRef.current = null;
        lastShorelineRef.current = null;
        lastShapesCountRef.current = 0;
        lastArterialsCountRef.current = 0;
        lastRoadsCountRef.current = 0;
        if (elevationGraphicsRef.current) elevationGraphicsRef.current.clear();
        if (flowGraphicsRef.current) flowGraphicsRef.current.clear();
        if (shorelineInteriorGraphicsRef.current) shorelineInteriorGraphicsRef.current.clear();
        if (shorelineEdgeGraphicsRef.current) shorelineEdgeGraphicsRef.current.clear();
      }
    });
    return unsubscribe;
  }, [resetElevationState]);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      const transform = createInitialTransform();

      p.setup = () => {
        const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
        canvasElementRef.current = canvas.elt;
        canvas.parent(containerRef.current!);
        p.pixelDensity(window.devicePixelRatio || 1);
        const s = engine.state;
        centerTransform(transform, p.width, p.height, s.simWidth, s.simHeight);

        // Trigger subscriptions now that p5 is ready (ensures elevation baking can start)
        engine.notify();
      };

      p.draw = () => {
        const frameStart = performance.now();
        const s = engine.state;
        const curStep = activeStepRef.current;
        const { offset, scale } = transform;
        const viz = s.visualizationSettings;
        p.background(7, 10, 20);

        const padding = 100 / scale;
        const viewBounds = {
          minX: -offset.x / scale - padding, minY: -offset.y / scale - padding,
          maxX: (p.width - offset.x) / scale + padding, maxY: (p.height - offset.y) / scale + padding
        };

        const curStepDef = curStep >= 1 ? STEPS[curStep - 1] : undefined;

        if (s.flowField && s.flowField !== lastFlowFieldRef.current) {
          const bakeStart = performance.now();
          lastFlowFieldRef.current = s.flowField;
          if (!flowGraphicsRef.current || flowGraphicsRef.current.width !== s.flowField.width || flowGraphicsRef.current.height !== s.flowField.height) {
            if (flowGraphicsRef.current) flowGraphicsRef.current.remove();
            flowGraphicsRef.current = p.createGraphics(s.flowField.width, s.flowField.height);
          }
          Drawers.bakeFlowField(p, flowGraphicsRef.current, s.flowField);
          s.renderTimings['FLOW_BAKE'] = performance.now() - bakeStart;
        }

        if (s.shorelines.length > 0 && s.shorelines !== lastShorelineRef.current) {
          const bakeStart = performance.now();
          lastShorelineRef.current = s.shorelines;
          const ff = s.flowField || { width: s.simWidth, height: s.simHeight, originX: 0, originY: 0 };
          if (!shorelineInteriorGraphicsRef.current || shorelineInteriorGraphicsRef.current.width !== ff.width) {
            if (shorelineInteriorGraphicsRef.current) shorelineInteriorGraphicsRef.current.remove();
            shorelineInteriorGraphicsRef.current = p.createGraphics(ff.width, ff.height);
          }
          if (!shorelineEdgeGraphicsRef.current || shorelineEdgeGraphicsRef.current.width !== ff.width) {
            if (shorelineEdgeGraphicsRef.current) shorelineEdgeGraphicsRef.current.remove();
            shorelineEdgeGraphicsRef.current = p.createGraphics(ff.width, ff.height);
          }
          Drawers.bakeShorelineInterior(shorelineInteriorGraphicsRef.current, s.elevation!, s.settings.terrainWaterLevel, ff.width, ff.height);
          Drawers.bakeShorelineEdge(p, shorelineEdgeGraphicsRef.current, s.shorelines);
          s.renderTimings['SHORE_BAKE'] = performance.now() - bakeStart;
        }

        if (s.shapes.length > 0 && s.shapes.length !== lastShapesCountRef.current) {
          const bakeStart = performance.now();
          lastShapesCountRef.current = s.shapes.length;
          if (!shapesGraphicsRef.current) shapesGraphicsRef.current = p.createGraphics(s.simWidth, s.simHeight);
          Drawers.bakeShapes(p, shapesGraphicsRef.current, s.shapes);
          s.renderTimings['SHAPE_BAKE'] = performance.now() - bakeStart;
        }

        if (s.arterials.length > 0 && s.arterials.length !== lastArterialsCountRef.current) {
          const bakeStart = performance.now();
          lastArterialsCountRef.current = s.arterials.length;
          if (!arterialsGraphicsRef.current) arterialsGraphicsRef.current = p.createGraphics(s.simWidth, s.simHeight);
          Drawers.bakeArterials(p, arterialsGraphicsRef.current, s.arterials, viz);
          s.renderTimings['ART_BAKE'] = performance.now() - bakeStart;
        }

        if (s.roads.length > 0 && s.roads.length !== lastRoadsCountRef.current) {
          if (!roadsGraphicsRef.current) roadsGraphicsRef.current = p.createGraphics(s.simWidth, s.simHeight);
          if (s.roads.length - lastRoadsCountRef.current > 100 || curStepDef?.forceRoadBake) {
            const bakeStart = performance.now();
            Drawers.bakeRoads(p, roadsGraphicsRef.current, s.roads, viz);
            lastRoadsCountRef.current = s.roads.length;
            s.renderTimings['ROAD_BAKE'] = performance.now() - bakeStart;
          }
        }

        // Active Render Phase
        const renderStart = performance.now();
        p.push();
        p.translate(offset.x, offset.y); p.scale(scale);

        let layerStart;

        if (viz.renderElevation && elevationGraphicsRef.current) {
          layerStart = performance.now();
          const ff = s.flowField || { width: s.simWidth, height: s.simHeight, originX: 0, originY: 0 };
          p.image(elevationGraphicsRef.current, ff.originX, ff.originY, ff.width, ff.height);
          s.renderTimings['ELEV_RENDER'] = performance.now() - layerStart;
        }

        layerStart = performance.now();
        Drawers.drawGrid(p, viewBounds);
        s.renderTimings['GRID_RENDER'] = performance.now() - layerStart;

        Drawers.drawSimulationBoundary(p, s.simWidth, s.simHeight);

        if (viz.renderShorelines) {
          layerStart = performance.now();
          Drawers.drawShorelines(p, s.shorelines, viewBounds, shorelineInteriorGraphicsRef.current ?? undefined, shorelineEdgeGraphicsRef.current ?? undefined);
          s.renderTimings['SHORE_RENDER'] = performance.now() - layerStart;
        }

        if (viz.renderFlowField && flowGraphicsRef.current) {
          layerStart = performance.now();
          p.tint(255, 120); p.image(flowGraphicsRef.current, s.flowField!.originX, s.flowField!.originY); p.noTint();
          s.renderTimings['FLOW_RENDER'] = performance.now() - layerStart;
        }

        layerStart = performance.now();
        Drawers.drawShapes(p, s.shapes, s.arterials, s.hoveredShapeIndex, s.activeSubdivisionIndex, viewBounds, shapesGraphicsRef.current ?? undefined, s.processedShapeIndices);
        s.renderTimings['SHAPE_RENDER'] = performance.now() - layerStart;

        layerStart = performance.now();
        Drawers.drawArterials(p, s.arterials, viewBounds, viz, arterialsGraphicsRef.current ?? undefined);
        s.renderTimings['ART_RENDER'] = performance.now() - layerStart;

        layerStart = performance.now();
        Drawers.drawRoads(p, s.roads, s.recentRoads, s.usageMap, viewBounds, viz, roadsGraphicsRef.current ?? undefined, lastRoadsCountRef.current);
        s.renderTimings['ROAD_RENDER'] = performance.now() - layerStart;

        if (viz.renderHubs) Drawers.drawHubs(p, s.hubs, viewBounds);
        Drawers.drawExits(p, s.exits, viewBounds);

        layerStart = performance.now();
        Drawers.drawAnts(p, s.ants, viewBounds, viz);
        s.renderTimings['AGENT_RENDER'] = performance.now() - layerStart;

        Drawers.drawActivePath(p, s.activePath);
        Drawers.drawEvents(p, s.events);
        Drawers.drawNames(p, s.geography, viewBounds);
        p.pop();

        s.renderTimings['RENDER_TOTAL'] = performance.now() - renderStart;
        s.renderTimings['TOTAL'] = performance.now() - frameStart;
      };

      // Attach mouse/touch/wheel controls for pan and zoom
      attachCanvasControls(p, transform, canvasElementRef);
    };

    p5Instance.current = new p5(sketch);
    return () => {
      if (p5Instance.current) p5Instance.current.remove();
      if (flowGraphicsRef.current) flowGraphicsRef.current.remove();
      if (elevationGraphicsRef.current) elevationGraphicsRef.current.remove();
      if (shorelineInteriorGraphicsRef.current) shorelineInteriorGraphicsRef.current.remove();
      if (shorelineEdgeGraphicsRef.current) shorelineEdgeGraphicsRef.current.remove();
      if (shapesGraphicsRef.current) shapesGraphicsRef.current.remove();
      if (arterialsGraphicsRef.current) arterialsGraphicsRef.current.remove();
      if (roadsGraphicsRef.current) roadsGraphicsRef.current.remove();
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 w-full h-full bg-slate-950 z-0" />;
};
