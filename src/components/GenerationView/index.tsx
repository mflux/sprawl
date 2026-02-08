
import React, { useState, useCallback, useEffect } from 'react';
import { GenerationCanvas } from '../GenerationCanvas';
import engine from '../../state/engine';
import { useUIStore } from '../../state/uiStore';
import { VisualizationSettings } from '../../types';
import { STEPS, STEP_COUNT } from '../../steps/registry';
import { ControlCenter } from './ControlCenter';
import { WorkflowDock } from './WorkflowDock';
import { ProfilingWindow } from './ProfilingWindow';
import { RenderProfiler } from './RenderProfiler';

export const GenerationView: React.FC = () => {
  const activeStep = useUIStore((s) => s.activeStep);
  const setActiveStep = useUIStore((s) => s.setActiveStep);
  const settings = useUIStore((s) => s.settings);
  const updateSetting = useUIStore((s) => s.updateSetting);
  const updateVizSetting = useUIStore((s) => s.updateVizSetting);

  // Subscribe to tick so we re-render when engine notifies
  useUIStore((s) => s.tick);

  const [isGeneratingLandscape, setIsGeneratingLandscape] = useState(false);

  /** Execute a step by its 1-based step number (STEPS index + 1). */
  const executeStep = useCallback(async (stepNum: number) => {
    const stepDef = STEPS[stepNum - 1];
    if (!stepDef) return;

    // Resolve any in-progress simulation before transitioning
    engine.cleanupCurrentPhase();

    setActiveStep(stepNum);

    // Apply viz transitions
    for (const [key, value] of Object.entries(stepDef.vizTransitions)) {
      updateVizSetting(
        key as keyof VisualizationSettings,
        value as VisualizationSettings[keyof VisualizationSettings],
      );
    }

    // Apply initial sim speed if defined
    if (stepDef.initialSimSpeed !== undefined) {
      updateSetting('simSpeed', stepDef.initialSimSpeed);
    }

    // Show landscape spinner for reset-capable steps
    if (stepDef.canReset) {
      setIsGeneratingLandscape(true);
    }

    await stepDef.execute();

    if (stepDef.canReset) {
      setIsGeneratingLandscape(false);
    }
  }, [setActiveStep, updateVizSetting, updateSetting]);

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
  const running = engine.isRunning();

  // Current step completion and controls — driven by the step definition
  const currentDef = activeStep >= 1 ? STEPS[activeStep - 1] : null;
  const isCurrentComplete = currentDef ? currentDef.isComplete() : true;
  const showSimulationControls = !!currentDef?.hasSimControls && !isCurrentComplete;

  let nextStepToExecute: number | null = null;
  if (activeStep === 0) {
    nextStepToExecute = 1;
  } else if (isCurrentComplete && activeStep < STEP_COUNT) {
    nextStepToExecute = activeStep + 1;
  }

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
        isSimulating={running || isGeneratingLandscape || !isCurrentComplete || s.isBakingElevation}
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
