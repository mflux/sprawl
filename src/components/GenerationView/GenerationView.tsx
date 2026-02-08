
import React, { useState, useCallback, useEffect } from 'react';
import { GenerationCanvas } from '../GenerationCanvas/GenerationCanvas';
import engine, { EnginePhase } from '../../state/engine';
import { useUIStore } from '../../state/uiStore';
import { VisualizationSettings } from '../../types';
import { stepInfo as step1Info } from '../../steps/landscape_gen';
import { stepInfo as step2Info } from '../../steps/infrastructure_gen';
import { stepInfo as step3Info } from '../../steps/urban_growth';
import { stepInfo as step4Info } from '../../steps/structural_analysis';
import { stepInfo as step5Info } from '../../steps/block_subdivision';
import { stepInfo as step6Info } from '../../steps/traffic_simulation';
import { stepInfo as step7Info } from '../../steps/ai_naming';
import { ControlCenter } from './ControlCenter';
import { WorkflowDock } from './WorkflowDock';
import { ProfilingWindow } from './ProfilingWindow';
import { RenderProfiler } from './RenderProfiler';

const STEP_INFO_MAP: Record<number, { title: string; desc: string; vizTransitions: Partial<VisualizationSettings> }> = {
  1: step1Info,
  2: step2Info,
  3: step3Info,
  4: step4Info,
  5: step5Info,
  6: step6Info,
  7: step7Info,
};

/** Map workflow step number → engine phase */
const STEP_TO_PHASE: Record<number, EnginePhase> = {
  1: 'landscape',
  2: 'hub_animation',
  3: 'ant_simulation',
  4: 'idle',        // structural analysis is synchronous
  5: 'subdivision',
  6: 'traffic',
  7: 'naming',
};

export const GenerationView: React.FC = () => {
  const activeStep = useUIStore((s) => s.activeStep);
  const setActiveStep = useUIStore((s) => s.setActiveStep);
  const settings = useUIStore((s) => s.settings);
  // vizSettings is accessed via engine.state.visualizationSettings in the canvas
  const updateSetting = useUIStore((s) => s.updateSetting);
  const updateVizSetting = useUIStore((s) => s.updateVizSetting);

  // Subscribe to tick so we re-render when engine notifies
  useUIStore((s) => s.tick);

  const [isGeneratingLandscape, setIsGeneratingLandscape] = useState(false);

  const applyVizTransitions = useCallback((step: number) => {
    const info = STEP_INFO_MAP[step];
    if (info?.vizTransitions) {
      const transitions = info.vizTransitions;
      for (const [key, value] of Object.entries(transitions)) {
        updateVizSetting(key as keyof VisualizationSettings, value as VisualizationSettings[keyof VisualizationSettings]);
      }
    }
  }, [updateVizSetting]);

  const executeStep = useCallback(async (step: number) => {
    setActiveStep(step);
    applyVizTransitions(step);

    const phase = STEP_TO_PHASE[step];
    if (!phase) return;

    if (step === 1) {
      setIsGeneratingLandscape(true);
      await engine.executePhase('landscape');
      setIsGeneratingLandscape(false);
    } else if (step === 3) {
      // Set speed before starting ant simulation
      updateSetting('simSpeed', 12);
      await engine.executePhase(phase);
    } else if (step === 5) {
      updateSetting('simSpeed', 1);
      await engine.executePhase(phase);
    } else if (step === 6) {
      updateSetting('simSpeed', 2);
      await engine.executePhase(phase);
    } else {
      await engine.executePhase(phase);
    }
  }, [setActiveStep, applyVizTransitions, updateSetting]);

  // Auto-start step 1 on mount
  useEffect(() => {
    if (activeStep === 0 && engine.state.hubs.length === 0 && engine.state.hubQueue.length === 0) {
      const timer = setTimeout(() => executeStep(1), 300);
      return () => clearTimeout(timer);
    }
  }, [executeStep, activeStep]);

  const handleToggleSim = (val: boolean) => {
    if (val) engine.start();
    else engine.pause();
  };

  const handleStep = () => {
    engine.step();
  };

  const handleResolve = () => {
    engine.resolve();
  };

  const handleSimSpeedChange = (val: number) => {
    updateSetting('simSpeed', val);
  };

  // Derive UI state from engine
  const s = engine.state;
  const phase = engine.getPhase();
  const running = engine.isRunning();

  const isStep2Done = activeStep === 2 && s.hubQueue.length === 0 && phase !== 'hub_animation';
  const isStep3Done = activeStep === 3 && s.currentWave >= settings.antWaves && !s.ants.some((a) => a.isAlive);
  const isStep5Done = activeStep === 5 && s.subdivisionQueue.length === 0 && phase !== 'subdivision';
  const isStep6Done = activeStep === 6 && s.usageCount >= settings.maxTrafficTrips;

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
      <GenerationCanvas activeStep={activeStep} />

      {/* Landscape Generation Indicator */}
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

      {/* Background Baking Compact UI */}
      {s.isBakingElevation && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[500] flex flex-col items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="px-4 py-2 bg-slate-900/90 border border-white/10 rounded-full backdrop-blur-xl shadow-2xl flex items-center gap-3">
            <div className="w-3 h-3 border border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-white uppercase tracking-widest">Baking Relief &bull; {Math.floor(s.elevationBakeProgress)}%</span>
              <div className="w-32 h-0.5 bg-slate-800 rounded-full mt-1 overflow-hidden border border-white/5">
                <div className="h-full bg-cyan-500 transition-all duration-300" style={{ width: `${s.elevationBakeProgress}%` }} />
              </div>
            </div>
          </div>
          <p className="text-[7px] text-slate-500 uppercase font-black tracking-tighter drop-shadow-md">Rendering Background Chunks...</p>
        </div>
      )}

      <ControlCenter />
      <RenderProfiler />
      <ProfilingWindow />
      <WorkflowDock
        onExecuteStep={executeStep}
        activeStep={activeStep}
        isSimulating={running || isGeneratingLandscape || phase === 'naming' || s.isBakingElevation}
        setIsSimulating={handleToggleSim}
        onStep={handleStep}
        onResolve={handleResolve}
        simSpeed={settings.simSpeed}
        onSimSpeedChange={handleSimSpeedChange}
        showSimulationControls={showSimulationControls}
        nextStepToExecute={nextStepToExecute}
      />
    </div>
  );
};
