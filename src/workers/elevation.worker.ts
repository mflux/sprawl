/**
 * Elevation baking web worker.
 *
 * Receives chunk jobs, computes Perlin-noise terrain with relief shading,
 * and returns RGBA pixel data. Runs in a pool of workers for parallelism.
 */

import type { ElevationChunkJob, ElevationChunkResult, WorkerRiver } from './elevation.types';

// Narrow typing for the worker global — avoids adding "webworker" lib to the
// main tsconfig (which would conflict with DOM types).
interface WorkerSelf {
  onmessage: ((e: MessageEvent<ElevationChunkJob>) => void) | null;
  postMessage(message: ElevationChunkResult, transfer: Transferable[]): void;
}
declare const self: WorkerSelf;

// ── Perlin noise (seeded) ─────────────────────────────────────────────

class SimpleNoise {
  private p: number[];

  constructor(seedValue: number) {
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

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = this.fade(x);
    const v = this.fade(y);
    const A = this.p[X] + Y, AA = this.p[A], AB = this.p[A + 1];
    const B = this.p[X + 1] + Y, BA = this.p[B], BB = this.p[B + 1];
    return this.lerp(
      v,
      this.lerp(u, this.grad(this.p[AA], x, y), this.grad(this.p[BA], x - 1, y)),
      this.lerp(u, this.grad(this.p[AB], x, y - 1), this.grad(this.p[BB], x - 1, y - 1)),
    );
  }
}

// ── Terrain helpers ───────────────────────────────────────────────────

interface HeightParams {
  terrainScale: number;
  seed: number;
  rivers: WorkerRiver[];
}

function getHeight(x: number, y: number, noise: SimpleNoise, params: HeightParams): number {
  let amplitude = 1.0;
  let frequency = params.terrainScale;
  let noiseValue = 0;
  let maxAmplitude = 0;

  for (let i = 0; i < 4; i++) {
    const sampleX = (x + params.seed * 10000) * frequency;
    const sampleY = (y + params.seed * 10000) * frequency;
    noiseValue += noise.noise(sampleX, sampleY) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
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
    if (minDist < river.width) {
      height -= Math.cos((minDist / river.width) * (Math.PI / 2)) * river.depth;
    }
  }

  return Math.max(0, Math.min(1, height));
}

function getColor(h: number, wl: number): [number, number, number] {
  if (h < wl) return [8, 47, 73];
  if (h < wl + 0.04) return [15, 23, 42];
  if (h < 0.55) return [30, 41, 59];
  if (h < 0.75) return [51, 65, 85];
  if (h < 0.9) return [71, 85, 105];
  return [100, 116, 139];
}

// ── Message handler ───────────────────────────────────────────────────

self.onmessage = (e: MessageEvent<ElevationChunkJob>) => {
  const job = e.data;
  const noise = new SimpleNoise(job.seed);
  const data = new Uint8ClampedArray(job.chunkW * job.chunkH * 4);

  // Light direction (top-left)
  const lx = -0.5, ly = -0.5, lz = 0.707;

  for (let y = 0; y < job.chunkH; y++) {
    for (let x = 0; x < job.chunkW; x++) {
      const wx = job.originX + (job.chunkX + x) * job.res;
      const wy = job.originY + (job.chunkY + y) * job.res;
      const hC = getHeight(wx, wy, noise, job);

      let shading = 1.0;
      if (hC >= job.waterLevel) {
        const eps = job.res;
        const hL = getHeight(wx - eps, wy, noise, job);
        const hR = getHeight(wx + eps, wy, noise, job);
        const hU = getHeight(wx, wy - eps, noise, job);
        const hD = getHeight(wx, wy + eps, noise, job);
        const strength = 750.0;
        const nx = -(hR - hL) * (strength / eps);
        const ny = -(hD - hU) * (strength / eps);
        const nz = 1.0;
        const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
        const dot = (nx / nLen * lx) + (ny / nLen * ly) + (nz / nLen * lz);
        shading = 0.8 + (dot - 0.1) * 0.4;
      }

      const rgb = getColor(hC, job.waterLevel);
      const idx = (x + y * job.chunkW) * 4;
      data[idx] = Math.min(255, rgb[0] * shading);
      data[idx + 1] = Math.min(255, rgb[1] * shading);
      data[idx + 2] = Math.min(255, rgb[2] * shading);
      data[idx + 3] = 255;
    }
  }

  const result: ElevationChunkResult = {
    chunkX: job.chunkX,
    chunkY: job.chunkY,
    chunkW: job.chunkW,
    chunkH: job.chunkH,
    data,
  };

  self.postMessage(result, [data.buffer]);
};
