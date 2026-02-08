import { useEffect, useRef, useCallback } from 'react';
import { useElevationWorkers } from './useElevationWorkers';
import type { ElevationChunkJob, ElevationChunkResult } from '../../workers/elevation.types';
import engine from '../../state/engine';
import p5 from 'p5';

const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

interface ElevationBakeState {
    lastElevation: unknown;
    lastElevationRes: number;
    bakeJobCount: number;
    completedJobs: number;
}

/**
 * Hook that manages elevation baking as an event-driven process.
 * Subscribes to engine state changes and dispatches worker jobs when elevation changes.
 * 
 * @param p5Instance - Reference to the p5 instance for creating graphics
 * @param elevationGraphicsRef - Reference to the elevation graphics buffer
 * @param STEPS - Steps registry for determining resolution settings
 */
export function useElevationBaking(
    p5Instance: React.MutableRefObject<p5 | null>,
    elevationGraphicsRef: React.MutableRefObject<p5.Graphics | null>,
    STEPS: readonly { highResElevation?: boolean }[]
) {
    const stateRef = useRef<ElevationBakeState>({
        lastElevation: null,
        lastElevationRes: 10,
        bakeJobCount: 0,
        completedJobs: 0
    });

    // Handle chunk completion - draw to graphics buffer
    const handleChunkComplete = useCallback((result: ElevationChunkResult) => {
        const { chunkX, chunkY, chunkW, chunkH, data } = result;
        if (elevationGraphicsRef.current && p5Instance.current) {
            const pg = elevationGraphicsRef.current;
            const img = p5Instance.current.createImage(chunkW, chunkH);
            img.loadPixels();
            (img.pixels as unknown as Uint8ClampedArray).set(data);
            img.updatePixels();
            pg.image(img, chunkX, chunkY);

            stateRef.current.completedJobs++;
            if (stateRef.current.bakeJobCount > 0) {
                engine.state.elevationBakeProgress = (stateRef.current.completedJobs / stateRef.current.bakeJobCount) * 100;
                if (stateRef.current.completedJobs >= stateRef.current.bakeJobCount) {
                    engine.state.isBakingElevation = false;
                }
            }
            engine.notify();
        }
    }, [elevationGraphicsRef, p5Instance]);

    const { dispatchJobs } = useElevationWorkers(handleChunkComplete);

    // Subscribe to engine state changes and dispatch elevation jobs when needed
    useEffect(() => {
        const unsubscribe = engine.subscribe(() => {
            const s = engine.state;
            const p = p5Instance.current;
            if (!p || !s.elevation) return;

            const curStep = s.activeStep;
            const curStepDef = curStep >= 1 ? STEPS[curStep - 1] : undefined;
            const baseRes = curStepDef?.highResElevation ? 1.5 : 3.0;
            const targetRes = IS_MOBILE ? baseRes * 2 : baseRes;

            const state = stateRef.current;
            const resChanged = Math.abs(targetRes - state.lastElevationRes) > 0.01;
            const elevationChanged = s.elevation !== state.lastElevation;

            if (!elevationChanged && !resChanged) return;

            const bakeStart = performance.now();
            state.lastElevation = s.elevation;
            state.lastElevationRes = targetRes;

            const ff = s.flowField || { width: s.simWidth, height: s.simHeight, originX: 0, originY: 0 };
            const tw = Math.ceil(ff.width / targetRes);
            const th = Math.ceil(ff.height / targetRes);

            // Create or resize graphics buffer
            if (!elevationGraphicsRef.current || elevationGraphicsRef.current.width !== tw || elevationGraphicsRef.current.height !== th) {
                if (elevationGraphicsRef.current) elevationGraphicsRef.current.remove();
                elevationGraphicsRef.current = p.createGraphics(tw, th);
            }
            elevationGraphicsRef.current.background(7, 10, 20);

            // Set baking state
            s.isBakingElevation = true;
            s.elevationBakeProgress = 0;
            state.completedJobs = 0;

            // Generate chunk jobs
            const chunkSize = IS_MOBILE ? 256 : 128;
            const jobList: ElevationChunkJob[] = [];
            for (let cx = 0; cx < tw; cx += chunkSize) {
                for (let cy = 0; cy < th; cy += chunkSize) {
                    jobList.push({
                        chunkX: cx,
                        chunkY: cy,
                        chunkW: Math.min(chunkSize, tw - cx),
                        chunkH: Math.min(chunkSize, th - cy),
                        originX: ff.originX,
                        originY: ff.originY,
                        res: targetRes,
                        waterLevel: s.settings.terrainWaterLevel,
                        terrainScale: s.settings.terrainScale,
                        seed: s.elevation.seed,
                        rivers: s.rivers.map(r => ({
                            points: r.points.map(pt => ({ x: pt.x, y: pt.y })),
                            width: r.width,
                            depth: r.depth
                        }))
                    });
                }
            }

            state.bakeJobCount = jobList.length;
            dispatchJobs(jobList);
            s.renderTimings['ELEV_BAKE_INIT'] = performance.now() - bakeStart;
            engine.notify();
        });

        return unsubscribe;
    }, [dispatchJobs, elevationGraphicsRef, STEPS]);

    // Reset state when elevation is cleared
    const resetState = useCallback(() => {
        stateRef.current.lastElevation = null;
    }, []);

    return { resetState };
}
