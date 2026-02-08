import { useEffect, useRef, useCallback } from 'react';
import type { ElevationChunkJob, ElevationChunkResult } from '../../workers/elevation.types';

const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export type ChunkCompleteHandler = (result: ElevationChunkResult) => void;

interface ElevationWorkerPool {
  /** Fan out a batch of chunk jobs across the worker pool. */
  dispatchJobs: (jobs: ElevationChunkJob[]) => void;
}

/**
 * Manages a pool of elevation-baking web workers.
 *
 * Workers are created on mount and terminated on unmount.
 * Each completed chunk invokes `onChunkComplete`.
 */
export function useElevationWorkers(
  onChunkComplete: ChunkCompleteHandler,
): ElevationWorkerPool {
  const poolRef = useRef<Worker[]>([]);
  const callbackRef = useRef<ChunkCompleteHandler>(onChunkComplete);

  // Keep callback ref current without restarting workers
  useEffect(() => {
    callbackRef.current = onChunkComplete;
  }, [onChunkComplete]);

  // Create and tear down the worker pool
  useEffect(() => {
    const numWorkers = IS_MOBILE ? 1 : Math.max(2, Math.min(navigator.hardwareConcurrency || 4, 4));
    const pool: Worker[] = [];

    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(
        new URL('../../workers/elevation.worker.ts', import.meta.url),
        { type: 'module' },
      );
      worker.onmessage = (e: MessageEvent<ElevationChunkResult>) => {
        callbackRef.current(e.data);
      };
      pool.push(worker);
    }

    poolRef.current = pool;

    return () => {
      pool.forEach((w) => w.terminate());
      poolRef.current = [];
    };
  }, []);

  const dispatchJobs = useCallback((jobs: ElevationChunkJob[]) => {
    const pool = poolRef.current;
    if (pool.length === 0) return;
    jobs.forEach((job, index) => {
      pool[index % pool.length].postMessage(job);
    });
  }, []);

  return { dispatchJobs };
}
