
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GenerationCanvas } from '../GenerationCanvas/GenerationCanvas';
import { state as genState, addProfileLog, saveSettings, saveVizSettings } from '../../state/store';
import { runLandscapeGen, stepInfo as step1Info } from '../../steps/landscape_gen';
import { runInfrastructureGen, stepInfo as step2Info } from '../../steps/infrastructure_gen';
import { runUrbanGrowth, stepInfo as step3Info } from '../../steps/urban_growth';
import { runStructuralAnalysis, stepInfo as step4Info } from '../../steps/structural_analysis';
import { prepareSubdivision, subdivideShape, finalizeSubdivision, stepInfo as step5Info } from '../../steps/block_subdivision';
import { runTrafficSimulation, stepInfo as step6Info } from '../../steps/traffic_simulation';
import { runAINaming, stepInfo as step7Info } from '../../steps/ai_naming';
import { useSimulation } from './useSimulation';
import { ControlCenter } from './ControlCenter';
import { WorkflowDock } from './WorkflowDock';
import { ProfilingWindow } from './ProfilingWindow';
import { RenderProfiler } from './RenderProfiler';
import { RoadNetwork } from '../../modules/RoadNetwork';
import { TerrainCulling } from '../../modules/TerrainCulling';
import { ShapeDetector } from '../../modules/ShapeDetector';
import { ArterialDetector } from '../../modules/ArterialDetector';

interface GenerationViewProps {
  setView?: (view: 'generation' | 'concepts') => void;
}

const STEP_INFO_MAP: Record<number, any> = {
  1: step1Info,
  2: step2Info,
  3: step3Info,
  4: step4Info,
  5: step5Info,
  6: step6Info,
  7: step7Info
};

export const GenerationView: React.FC<GenerationViewProps> = ({ setView }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState(false);
  const [isSimulatingSubdivision, setIsSimulatingSubdivision] = useState(false);
  const [isAnimatingHubs, setIsAnimatingHubs] = useState(false);
  const [isGeneratingLandscape, setIsGeneratingLandscape] = useState(false);
  const [isNaming, setIsNaming] = useState(false);
  const [, setTick] = useState(0);

  const triggerUpdate = useCallback(() => {
    genState.iteration++;
    setTick(t => t + 1);
  }, []);

  const onSimulationFinished = useCallback((functionName: string, duration: number) => {
    addProfileLog(functionName, duration);
  }, []);

  const { isSimulating, setIsSimulating, stepSimulation, resolveSimulation: resolveAnts } = useSimulation(triggerUpdate, onSimulationFinished);

  const applyVizTransitions = useCallback((step: number) => {
    const info = STEP_INFO_MAP[step];
    if (info && info.vizTransitions) {
      Object.assign(genState.visualizationSettings, info.vizTransitions);
      saveVizSettings(genState.visualizationSettings);
    }
  }, []);

  const resolveHubs = useCallback(() => {
    if (genState.hubQueue.length === 0) return;
    while (genState.hubQueue.length > 0) {
      const hub = genState.hubQueue.shift();
      if (hub) {
        hub.spawnTime = Date.now();
        genState.hubs.push(hub);
        const pts = hub.shapePoints;
        for (let v = 0; v < pts.length; v++) {
          RoadNetwork.addSegmentSnapped(pts[v], pts[(v + 1) % pts.length], genState.roads, 5);
        }
      }
    }
    genState.geography.hubs = genState.hubs.map(hub => {
      let minDist = Infinity;
      genState.shorelines.forEach(s => {
        const cp = s.closestPoint(hub.position);
        const d = hub.position.dist(cp);
        if (d < minDist) minDist = d;
      });
      return { id: hub.id, position: { x: hub.position.x, y: hub.position.y }, size: hub.size, tier: hub.tier, distToWater: minDist };
    });
    if (genState.elevation) {
      genState.roads = TerrainCulling.cullSegments(genState.roads, genState.elevation, genState.settings.terrainWaterLevel);
    }
    const detectedShapes = ShapeDetector.detectShapes(genState.roads);
    genState.shapes = detectedShapes;
    if (detectedShapes.length > 0) {
      genState.arterials = ArterialDetector.detectArterialsFromShapes(detectedShapes, 45);
    }
    setIsAnimatingHubs(false);
    triggerUpdate();
  }, [triggerUpdate]);

  const performSubdivisionStep = useCallback(() => {
    if (genState.subdivisionQueue.length === 0) return false;
    const index = genState.subdivisionQueue.shift();
    if (index === undefined) return false;
    genState.activeSubdivisionIndex = index;
    subdivideShape(index);
    genState.processedShapeIndices.add(index);
    if (genState.subdivisionQueue.length === 0) {
      genState.activeSubdivisionIndex = null;
      finalizeSubdivision();
      setIsSimulatingSubdivision(false);
      triggerUpdate();
      return false;
    } else {
      triggerUpdate();
      return true;
    }
  }, [triggerUpdate]);

  const resolveSubdivision = useCallback(() => {
    if (genState.subdivisionQueue.length === 0) return;
    setIsSimulatingSubdivision(false);
    const start = performance.now();
    while (genState.subdivisionQueue.length > 0) {
      const index = genState.subdivisionQueue.shift();
      if (index !== undefined) {
        genState.activeSubdivisionIndex = index;
        subdivideShape(index);
        genState.processedShapeIndices.add(index);
      }
    }
    genState.activeSubdivisionIndex = null;
    finalizeSubdivision();
    onSimulationFinished('BlockSubdivision.resolveInstant', performance.now() - start);
    triggerUpdate();
  }, [triggerUpdate, onSimulationFinished]);

  const executeStep = useCallback(async (step: number) => {
    if (activeStep === 2 && step !== 2) resolveHubs();
    if (activeStep === 5 && step !== 5) resolveSubdivision();
    if (genState.ants.some(a => a.isAlive)) resolveAnts();

    setActiveStep(step);
    setIsSimulatingTraffic(false);
    setIsSimulatingSubdivision(false);
    setIsAnimatingHubs(false);
    setIsNaming(false);
    applyVizTransitions(step);

    switch (step) {
      case 1:
        setIsGeneratingLandscape(true);
        setTimeout(() => {
          runLandscapeGen();
          setIsGeneratingLandscape(false);
          setIsSimulating(false);
          triggerUpdate();
        }, 100);
        break;
      case 2:
        runInfrastructureGen();
        setIsAnimatingHubs(true);
        break;
      case 3:
        genState.settings.simSpeed = 12;
        saveSettings(genState.settings);
        runUrbanGrowth();
        setIsSimulating(true);
        break;
      case 4:
        setIsSimulating(false);
        runStructuralAnalysis();
        break;
      case 5:
        genState.settings.simSpeed = 1;
        saveSettings(genState.settings);
        setIsSimulating(false);
        prepareSubdivision();
        setIsSimulatingSubdivision(true);
        break;
      case 6:
        genState.settings.simSpeed = 2;
        saveSettings(genState.settings);
        setIsSimulatingTraffic(true);
        break;
      case 7:
        setIsNaming(true);
        await runAINaming();
        setIsNaming(false);
        break;
      default:
        break;
    }
    triggerUpdate();
  }, [resolveAnts, setIsSimulating, triggerUpdate, activeStep, resolveSubdivision, resolveHubs, applyVizTransitions]);

  useEffect(() => {
    let interval: any;
    if (isAnimatingHubs && genState.hubQueue.length > 0) {
      interval = setInterval(() => {
        const hub = genState.hubQueue.shift();
        if (hub) {
          hub.spawnTime = Date.now();
          genState.hubs.push(hub);
          const pts = hub.shapePoints;
          for (let v = 0; v < pts.length; v++) {
            RoadNetwork.addSegmentSnapped(pts[v], pts[(v + 1) % pts.length], genState.roads, 5);
          }
          let minDist = Infinity;
          genState.shorelines.forEach(s => {
            const cp = s.closestPoint(hub.position);
            const d = hub.position.dist(cp);
            if (d < minDist) minDist = d;
          });
          genState.geography.hubs.push({ id: hub.id, position: { x: hub.position.x, y: hub.position.y }, size: hub.size, tier: hub.tier, distToWater: minDist });
          triggerUpdate();
        }
        if (genState.hubQueue.length === 0) {
          if (genState.elevation) genState.roads = TerrainCulling.cullSegments(genState.roads, genState.elevation, genState.settings.terrainWaterLevel);
          const detectedShapes = ShapeDetector.detectShapes(genState.roads);
          genState.shapes = detectedShapes;
          if (detectedShapes.length > 0) genState.arterials = ArterialDetector.detectArterialsFromShapes(detectedShapes, 45);
          setIsAnimatingHubs(false);
          triggerUpdate();
        }
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isAnimatingHubs, triggerUpdate]);

  useEffect(() => {
    let interval: any;
    if (isSimulatingSubdivision && genState.subdivisionQueue.length > 0) {
      interval = setInterval(() => {
        const speed = Math.max(1, genState.settings.simSpeed);
        for (let i = 0; i < speed; i++) if (!performSubdivisionStep()) break;
      }, 16); 
    }
    return () => clearInterval(interval);
  }, [isSimulatingSubdivision, performSubdivisionStep]);

  useEffect(() => {
    let interval: any;
    if (isSimulatingTraffic) {
      interval = setInterval(() => {
        const speed = Math.max(1, genState.settings.simSpeed);
        let more = true;
        for (let i = 0; i < speed; i++) {
          more = runTrafficSimulation();
          if (!more) break;
        }
        if (!more) setIsSimulatingTraffic(false);
        triggerUpdate();
      }, 60); 
    }
    return () => clearInterval(interval);
  }, [isSimulatingTraffic, triggerUpdate]);

  useEffect(() => {
    if (activeStep === 0 && genState.hubs.length === 0 && genState.hubQueue.length === 0) {
      const timer = setTimeout(() => executeStep(1), 300);
      return () => clearTimeout(timer);
    }
  }, [executeStep, activeStep]);

  const handleToggleSim = (val: boolean) => {
    if (activeStep === 6) setIsSimulatingTraffic(val);
    else if (activeStep === 5) setIsSimulatingSubdivision(val);
    else setIsSimulating(val);
  };
  const handleStep = () => {
    if (activeStep === 6) runTrafficSimulation();
    else if (activeStep === 5) performSubdivisionStep();
    else stepSimulation();
    triggerUpdate();
  };
  const handleResolve = () => {
    if (activeStep === 5) resolveSubdivision();
    else if (activeStep === 6) { while(runTrafficSimulation()); setIsSimulatingTraffic(false); }
    else resolveAnts();
    triggerUpdate();
  };
  const handleSimSpeedChange = (val: number) => {
    genState.settings.simSpeed = val;
    saveSettings(genState.settings);
    triggerUpdate();
  };

  const isStep2Done = activeStep === 2 && (genState.hubQueue.length === 0 && !isAnimatingHubs);
  const isStep3Done = activeStep === 3 && (genState.currentWave >= genState.settings.antWaves && !genState.ants.some(a => a.isAlive));
  const isStep5Done = activeStep === 5 && (genState.subdivisionQueue.length === 0 && !isSimulatingSubdivision);
  const isStep6Done = activeStep === 6 && (genState.usageCount >= genState.settings.maxTrafficTrips);

  let showSimulationControls = false;
  if (activeStep === 3) showSimulationControls = !isStep3Done;
  else if (activeStep === 5) showSimulationControls = !isStep5Done;
  else if (activeStep === 6) showSimulationControls = !isStep6Done;

  let nextStepToExecute: number | null = null;
  if (activeStep === 0) nextStepToExecute = 1;
  else if (activeStep === 1) nextStepToExecute = 2;
  else if (activeStep === 2 && isStep2Done) nextStepToExecute = 3;
  else if (activeStep === 3 && isStep3Done) nextStepToExecute = 4;
  else if (activeStep === 4) nextStepToExecute = 5;
  else if (activeStep === 5 && isStep5Done) nextStepToExecute = 6;
  else if (activeStep === 6 && isStep6Done) nextStepToExecute = 7;

  return (
    <div className="w-full h-screen relative bg-slate-950">
      <GenerationCanvas state={genState} activeStep={activeStep} onUpdate={triggerUpdate} />
      
      {/* Landscape Generation Indicator (Transparent backdrop) */}
      {isGeneratingLandscape && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-500 pointer-events-none">
          <div className="flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-2 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
            <div className="text-center space-y-1">
              <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Synthesizing Topography</h2>
              <p className="text-[8px] text-slate-400 uppercase tracking-widest animate-pulse font-bold">Initializing noise fields...</p>
            </div>
          </div>
        </div>
      )}

      {/* Background Baking Compact UI (Non-obtrusive) */}
      {genState.isBakingElevation && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[500] flex flex-col items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="px-4 py-2 bg-slate-900/90 border border-white/10 rounded-full backdrop-blur-xl shadow-2xl flex items-center gap-3">
             <div className="w-3 h-3 border border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
             <div className="flex flex-col">
               <span className="text-[8px] font-black text-white uppercase tracking-widest">Baking Relief • {Math.floor(genState.elevationBakeProgress)}%</span>
               <div className="w-32 h-0.5 bg-slate-800 rounded-full mt-1 overflow-hidden border border-white/5">
                 <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${genState.elevationBakeProgress}%` }} />
               </div>
             </div>
           </div>
           <p className="text-[7px] text-slate-500 uppercase font-black tracking-tighter drop-shadow-md">Rendering Background Chunks...</p>
        </div>
      )}

      <ControlCenter state={genState} onSettingChange={triggerUpdate} />
      <RenderProfiler state={genState} />
      <ProfilingWindow logs={genState.profileLogs} />
      <WorkflowDock 
        onExecuteStep={executeStep} activeStep={activeStep} 
        isSimulating={isSimulating || isSimulatingTraffic || isSimulatingSubdivision || isAnimatingHubs || isNaming || isGeneratingLandscape || genState.isBakingElevation}
        setIsSimulating={handleToggleSim} onStep={handleStep} onResolve={handleResolve}
        simSpeed={genState.settings.simSpeed} onSimSpeedChange={handleSimSpeedChange}
        showSimulationControls={showSimulationControls} nextStepToExecute={nextStepToExecute}
      />
    </div>
  );
};
