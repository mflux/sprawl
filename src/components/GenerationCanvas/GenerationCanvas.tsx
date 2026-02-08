
import React, { useEffect, useRef } from 'react';
import { GenerationState } from '../../types';
import * as Drawers from './drawers';
import { Vector2D } from '../../modules/Vector2D';

import p5 from 'p5';

// Environmental Detection
const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

interface GenerationCanvasProps {
  state: GenerationState;
  activeStep: number;
  onUpdate: () => void;
}

// WORKER CODE AS A BLOB-SAFE STRING
const WORKER_CODE = `
  class SimpleNoise {
    constructor(seedValue) {
      this.p = new Array(512);
      const permutation = Array.from({ length: 256 }, (_, i) => i);
      let seed = Math.floor(seedValue * 10000);
      for (let i = 255; i > 0; i--) {
        seed = (seed * 9301 + 49297) % 233280;
        const j = Math.floor((seed / 233280) * (i + 1));
        [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
      }
      for (let i = 0; i < 256; i++) {
        this.p[i] = this.p[i + 256] = permutation[i];
      }
    }
    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(t, a, b) { return a + t * (b - a); }
    grad(hash, x, y) {
      const h = hash & 15;
      const u = h < 8 ? x : y;
      const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    noise(x, y) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      x -= Math.floor(x);
      y -= Math.floor(y);
      const u = this.fade(x);
      const v = this.fade(y);
      const A = this.p[X] + Y, AA = this.p[A], AB = this.p[A + 1];
      const B = this.p[X + 1] + Y, BA = this.p[B], BB = this.p[B + 1];
      return this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y), this.grad(this.p[BA], x - 1, y)),
                           this.lerp(u, this.grad(this.p[AB], x, y - 1), this.grad(this.p[BB], x - 1, y - 1)));
    }
  }

  const getHeight = (x, y, noise, params) => {
    let amplitude = 1.0, frequency = params.terrainScale, noiseValue = 0, maxAmplitude = 0;
    for (let i = 0; i < 4; i++) {
      const sampleX = (x + params.seed * 10000) * frequency;
      const sampleY = (y + params.seed * 10000) * frequency;
      noiseValue += noise.noise(sampleX, sampleY) * amplitude;
      maxAmplitude += amplitude; amplitude *= 0.5; frequency *= 2.0;
    }
    let height = (noiseValue / maxAmplitude + 1) / 2;
    for (const river of params.rivers) {
      let minDistSq = Infinity;
      for (let i = 0; i < river.points.length - 1; i++) {
        const p1 = river.points[i], p2 = river.points[i + 1];
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const d2 = dx * dx + dy * dy;
        const t = d2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - p1.x) * dx + (y - p1.y) * dy) / d2));
        const dSq = (x - (p1.x + t * dx)) ** 2 + (y - (p1.y + t * dy)) ** 2;
        if (dSq < minDistSq) minDistSq = dSq;
      }
      const minDist = Math.sqrt(minDistSq);
      if (minDist < river.width) height -= Math.cos((minDist / river.width) * (Math.PI / 2)) * river.depth;
    }
    return Math.max(0, Math.min(1, height));
  };

  const getColor = (h, wl) => {
    if (h < wl) return [8, 47, 73];
    if (h < wl + 0.04) return [15, 23, 42];
    if (h < 0.55) return [30, 41, 59];
    if (h < 0.75) return [51, 65, 85];
    if (h < 0.9) return [71, 85, 105];
    return [100, 116, 139];
  };

  self.onmessage = (e) => {
    const p = e.data;
    const noise = new SimpleNoise(p.seed);
    const data = new Uint8ClampedArray(p.chunkW * p.chunkH * 4);
    const lx = -0.5, ly = -0.5, lz = 0.707;
    for (let y = 0; y < p.chunkH; y++) {
      for (let x = 0; x < p.chunkW; x++) {
        const wx = p.originX + (p.chunkX + x) * p.res, wy = p.originY + (p.chunkY + y) * p.res;
        const hC = getHeight(wx, wy, noise, p);
        let shading = 1.0;
        if (hC >= p.waterLevel) {
          const eps = p.res;
          const hL = getHeight(wx - eps, wy, noise, p), hR = getHeight(wx + eps, wy, noise, p);
          const hU = getHeight(wx, wy - eps, noise, p), hD = getHeight(wx, wy + eps, noise, p);
          const strength = 750.0;
          const nx = -(hR - hL) * (strength / eps), ny = -(hD - hU) * (strength / eps), nz = 1.0;
          const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
          const dot = (nx / nLen * lx) + (ny / nLen * ly) + (nz / nLen * lz);
          shading = 0.8 + (dot - 0.1) * 0.4;
        }
        const rgb = getColor(hC, p.waterLevel);
        const idx = (x + y * p.chunkW) * 4;
        data[idx] = Math.min(255, rgb[0] * shading);
        data[idx+1] = Math.min(255, rgb[1] * shading);
        data[idx+2] = Math.min(255, rgb[2] * shading);
        data[idx+3] = 255;
      }
    }
    self.postMessage({ chunkX: p.chunkX, chunkY: p.chunkY, chunkW: p.chunkW, chunkH: p.chunkH, data }, [data.buffer]);
  };
`;

export const GenerationCanvas: React.FC<GenerationCanvasProps> = ({ state, activeStep, onUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GenerationState>(state);
  const activeStepRef = useRef<number>(activeStep);
  const onUpdateRef = useRef<() => void>(onUpdate);
  
  const elevationGraphicsRef = useRef<p5.Graphics | null>(null);
  const lastElevationRef = useRef<unknown>(null);
  const lastElevationResRef = useRef<number>(10);
  
  const lastFlowFieldRef = useRef<unknown>(null);
  const lastShorelineRef = useRef<unknown>(null);
  const lastShapesCountRef = useRef<number>(0);
  const lastArterialsCountRef = useRef<number>(0);
  const lastRoadsCountRef = useRef<number>(0);

  const workerPoolRef = useRef<Worker[]>([]);
  const bakeJobCountRef = useRef<number>(0);
  const completedJobsRef = useRef<number>(0);

  const flowGraphicsRef = useRef<p5.Graphics | null>(null);
  const shorelineInteriorGraphicsRef = useRef<p5.Graphics | null>(null);
  const shorelineEdgeGraphicsRef = useRef<p5.Graphics | null>(null);
  const shapesGraphicsRef = useRef<p5.Graphics | null>(null);
  const arterialsGraphicsRef = useRef<p5.Graphics | null>(null);
  const roadsGraphicsRef = useRef<p5.Graphics | null>(null);
  
  const lastResetHandledRef = useRef<number>(0);

  useEffect(() => {
    stateRef.current = state;
    activeStepRef.current = activeStep;
    onUpdateRef.current = onUpdate;
    
    if (state.lastReset > lastResetHandledRef.current) {
      lastResetHandledRef.current = state.lastReset;
      if (shapesGraphicsRef.current) shapesGraphicsRef.current.clear();
      if (arterialsGraphicsRef.current) arterialsGraphicsRef.current.clear();
      if (roadsGraphicsRef.current) roadsGraphicsRef.current.clear();
      lastElevationRef.current = null;
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
  }, [state.iteration, state.lastReset, activeStep, onUpdate]);

  useEffect(() => {
    const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    const numWorkers = IS_MOBILE ? 1 : Math.max(2, Math.min(navigator.hardwareConcurrency || 4, 4));
    const pool: Worker[] = [];

    const handleMessage = (e: MessageEvent) => {
      const { chunkX, chunkY, chunkW, chunkH, data } = e.data;
      if (elevationGraphicsRef.current && p5Instance.current) {
        const pg = elevationGraphicsRef.current;
        const img = p5Instance.current.createImage(chunkW, chunkH);
        img.loadPixels();
        (img.pixels as unknown as Uint8ClampedArray).set(data);
        img.updatePixels();
        pg.image(img, chunkX, chunkY);
        completedJobsRef.current++;
        if (bakeJobCountRef.current > 0) {
          stateRef.current.elevationBakeProgress = (completedJobsRef.current / bakeJobCountRef.current) * 100;
          if (completedJobsRef.current >= bakeJobCountRef.current) {
            stateRef.current.isBakingElevation = false;
          }
        }
        onUpdateRef.current();
      }
    };

    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(blobUrl);
      worker.onmessage = handleMessage;
      pool.push(worker);
    }
    workerPoolRef.current = pool;

    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      const transform = { 
        offset: new Vector2D(0, 0), 
        scale: 0.2, 
        isPanning: false, 
        lastMouse: new Vector2D(0, 0),
        lastPinchDist: 0,
        lastPinchScale: 0.2,
        lastPinchMidpoint: new Vector2D(0, 0),
        lastPinchOffset: new Vector2D(0, 0)
      };

      p.setup = () => {
        const canvas = p.createCanvas(window.innerWidth, window.innerHeight);
        canvasElementRef.current = canvas.elt;
        canvas.parent(containerRef.current!);
        p.pixelDensity(window.devicePixelRatio || 1);
        const s = stateRef.current;
        const centerX = (p.width - s.simWidth * transform.scale) / 2;
        const centerY = (p.height - s.simHeight * transform.scale) / 2;
        transform.offset = new Vector2D(centerX, centerY);
      };

      p.draw = () => {
        const frameStart = performance.now();
        const s = stateRef.current;
        const curStep = activeStepRef.current;
        const { offset, scale } = transform;
        const viz = s.visualizationSettings;
        p.background(7, 10, 20); 
        
        const padding = 100 / scale;
        const viewBounds = {
          minX: -offset.x / scale - padding, minY: -offset.y / scale - padding,
          maxX: (p.width - offset.x) / scale + padding, maxY: (p.height - offset.y) / scale + padding
        };

        const isFinalStep = curStep === 7;
        const baseRes = isFinalStep ? 1.5 : 3.0;
        const targetRes = IS_MOBILE ? baseRes * 2 : baseRes;
        const resChanged = Math.abs(targetRes - lastElevationResRef.current) > 0.01;

        // Synthesis Phase
        if (s.elevation && (s.elevation !== lastElevationRef.current || resChanged)) {
          const bakeStart = performance.now();
          lastElevationRef.current = s.elevation;
          lastElevationResRef.current = targetRes;
          const ff = s.flowField || { width: s.simWidth, height: s.simHeight, originX: 0, originY: 0 };
          const tw = Math.ceil(ff.width / targetRes), th = Math.ceil(ff.height / targetRes);
          if (!elevationGraphicsRef.current || elevationGraphicsRef.current.width !== tw || elevationGraphicsRef.current.height !== th) {
            if (elevationGraphicsRef.current) elevationGraphicsRef.current.remove();
            elevationGraphicsRef.current = p.createGraphics(tw, th);
          }
          elevationGraphicsRef.current.background(7, 10, 20);
          s.isBakingElevation = true;
          s.elevationBakeProgress = 0;
          completedJobsRef.current = 0;
          const chunkSize = IS_MOBILE ? 256 : 128;
          const jobList = [];
          for (let cx = 0; cx < tw; cx += chunkSize) {
            for (let cy = 0; cy < th; cy += chunkSize) {
              jobList.push({
                chunkX: cx, chunkY: cy, chunkW: Math.min(chunkSize, tw - cx), chunkH: Math.min(chunkSize, th - cy),
                originX: ff.originX, originY: ff.originY, res: targetRes,
                waterLevel: s.settings.terrainWaterLevel, terrainScale: s.settings.terrainScale,
                seed: s.elevation.seed, rivers: s.rivers.map(r => ({ points: r.points.map(pt => ({x:pt.x, y:pt.y})), width: r.width, depth: r.depth }))
              });
            }
          }
          bakeJobCountRef.current = jobList.length;
          jobList.forEach((job, index) => {
            const worker = workerPoolRef.current[index % workerPoolRef.current.length];
            worker.postMessage(job);
          });
          s.renderTimings['ELEV_BAKE_INIT'] = performance.now() - bakeStart;
          onUpdateRef.current();
        }

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
           if (s.roads.length - lastRoadsCountRef.current > 100 || curStep >= 6) {
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
        Drawers.drawShapes(p, s.shapes, s.arterials, null, s.activeSubdivisionIndex, viewBounds, shapesGraphicsRef.current ?? undefined, s.processedShapeIndices);
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

      // p5 v2's bundled types are missing touch handler props — cast once
      const pTouch = p as P5WithTouchEvents;
      const getTouches = () => p.touches as unknown as P5Touch[];

      pTouch.touchStarted = (e: TouchEvent) => {
        if (e.target !== canvasElementRef.current) return;
        const t = getTouches();
        if (t.length === 1) {
          transform.isPanning = true;
          transform.lastMouse = new Vector2D(t[0].x, t[0].y);
        } else if (t.length === 2) {
          transform.isPanning = false;
          const d = p.dist(t[0].x, t[0].y, t[1].x, t[1].y);
          transform.lastPinchDist = d;
          transform.lastPinchScale = transform.scale;
          transform.lastPinchMidpoint = new Vector2D((t[0].x + t[1].x) / 2, (t[0].y + t[1].y) / 2);
          transform.lastPinchOffset = transform.offset.copy();
        }
        return false;
      };

      pTouch.touchMoved = (e: TouchEvent) => {
        if (e.target !== canvasElementRef.current) return;
        const t = getTouches();
        if (t.length === 1 && transform.isPanning) {
          const dx = t[0].x - transform.lastMouse.x;
          const dy = t[0].y - transform.lastMouse.y;
          transform.offset = transform.offset.add(new Vector2D(dx, dy));
          transform.lastMouse = new Vector2D(t[0].x, t[0].y);
        } else if (t.length === 2) {
          const d = p.dist(t[0].x, t[0].y, t[1].x, t[1].y);
          const ratio = d / transform.lastPinchDist;
          const newS = p.constrain(transform.lastPinchScale * ratio, 0.05, 20);
          
          const centerX = (t[0].x + t[1].x) / 2;
          const centerY = (t[0].y + t[1].y) / 2;
          const currentMidpoint = new Vector2D(centerX, centerY);
          
          // Stable anchor scale & pan (Google Maps style)
          const worldPointAtGestureStart = transform.lastPinchMidpoint.sub(transform.lastPinchOffset).div(transform.lastPinchScale);
          transform.offset = currentMidpoint.sub(worldPointAtGestureStart.mul(newS));
          transform.scale = newS;
        }
        return false;
      };

      pTouch.touchEnded = (e: TouchEvent) => {
        if (e.target !== canvasElementRef.current) return;
        const t = getTouches();
        if (t.length === 0) {
          transform.isPanning = false;
        } else if (t.length === 1) {
          transform.isPanning = true;
          transform.lastMouse = new Vector2D(t[0].x, t[0].y);
        }
        return false;
      };

      p.mousePressed = (e: MouseEvent) => { 
        if (e.target === canvasElementRef.current) { 
          transform.isPanning = true; 
          transform.lastMouse = new Vector2D(p.mouseX, p.mouseY); 
          return false;
        } 
      };
      p.mouseReleased = () => { transform.isPanning = false; };
      p.mouseDragged = () => { if (transform.isPanning) { const dx = p.mouseX - transform.lastMouse.x; const dy = p.mouseY - transform.lastMouse.y; transform.offset = transform.offset.add(new Vector2D(dx, dy)); transform.lastMouse = new Vector2D(p.mouseX, p.mouseY); } };
      p.mouseWheel = (e: WheelEvent) => { if (e.target !== canvasElementRef.current) return; const factor = Math.pow(0.9992, e.deltaY); const oldS = transform.scale; const newS = p.constrain(oldS * factor, 0.05, 20); const mx = p.mouseX, my = p.mouseY; transform.offset = new Vector2D(mx - (mx - transform.offset.x) * (newS / oldS), my - (my - transform.offset.y) * (newS / oldS)); transform.scale = newS; return false; };
      p.windowResized = () => { p.resizeCanvas(window.innerWidth, window.innerHeight); };
    };

    p5Instance.current = new p5(sketch);
    return () => {
      if (p5Instance.current) p5Instance.current.remove();
      workerPoolRef.current.forEach(w => w.terminate());
      URL.revokeObjectURL(blobUrl);
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
