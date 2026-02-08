/** Serialized river segment for the elevation worker. */
export interface WorkerRiver {
  points: { x: number; y: number }[];
  width: number;
  depth: number;
}

/** Message sent TO the elevation worker for one chunk of terrain. */
export interface ElevationChunkJob {
  chunkX: number;
  chunkY: number;
  chunkW: number;
  chunkH: number;
  originX: number;
  originY: number;
  res: number;
  waterLevel: number;
  terrainScale: number;
  seed: number;
  rivers: WorkerRiver[];
}

/** Message sent FROM the elevation worker when a chunk is complete. */
export interface ElevationChunkResult {
  chunkX: number;
  chunkY: number;
  chunkW: number;
  chunkH: number;
  data: Uint8ClampedArray;
}
