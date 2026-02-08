
import React, { useState, useEffect, useRef } from 'react';
import { stepInfo as step1Info } from '../../steps/landscape_gen';
import { stepInfo as step2Info } from '../../steps/infrastructure_gen';
import { stepInfo as step3Info } from '../../steps/urban_growth';
import { stepInfo as step4Info } from '../../steps/structural_analysis';
import { stepInfo as step5Info } from '../../steps/block_subdivision';
import { stepInfo as step6Info } from '../../steps/traffic_simulation';
import { stepInfo as step7Info } from '../../steps/ai_naming';

interface WorkflowDockProps {
  onExecuteStep: (step: number) => void;
  activeStep: number;
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  onStep: () => void;
  onResolve: () => void;
  simSpeed: number;
  onSimSpeedChange: (val: number) => void;
  showSimulationControls: boolean;
  nextStepToExecute: number | null;
}

const STEP_INFO_MAP: Record<number, { title: string, desc: string }> = {
  1: step1Info,
  2: step2Info,
  3: step3Info,
  4: step4Info,
  5: step5Info,
  6: step6Info,
  7: step7Info
};

const RESET_INFO = {
  title: "Reset Environment",
  desc: "Wipes the current simulation state and returns to Step 1 to generate a completely new landscape and topography."
};

export const WorkflowDock: React.FC<WorkflowDockProps> = ({ 
  onExecuteStep, 
  activeStep,
  isSimulating,
  setIsSimulating,
  onStep,
  onResolve,
  simSpeed,
  onSimSpeedChange,
  showSimulationControls,
  nextStepToExecute
}) => {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  // Global listener to clear tooltips when interacting with the map (outside dock)
  useEffect(() => {
    const handleGlobalInteraction = (e: PointerEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setHoveredStep(null);
      }
    };
    window.addEventListener('pointerdown', handleGlobalInteraction);
    return () => window.removeEventListener('pointerdown', handleGlobalInteraction);
  }, []);

  const stopEvent = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      ref={dockRef}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[200] max-w-[95vw]"
      onMouseDown={stopEvent}
      onPointerDown={stopEvent}
      onTouchStart={stopEvent}
      onWheel={stopEvent}
    >
      {/* Simulation Toolbar Overlay */}
      {showSimulationControls && (
        <div 
          className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-none"
        >
          <div className="flex flex-col gap-2 p-1.5 bg-slate-900/90 border border-white/10 rounded-lg backdrop-blur-xl shadow-2xl mb-1 pointer-events-auto min-w-[140px]">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsSimulating(!isSimulating)}
                className={`w-8 h-7 flex items-center justify-center rounded text-[10px] transition-all ${isSimulating ? 'bg-amber-600 text-white shadow-[0_0_10px_rgba(217,119,6,0.3)]' : 'bg-cyan-600 text-white hover:bg-cyan-500'}`}
                title={isSimulating ? "Pause" : "Play"}
              >
                {isSimulating ? '||' : '▶'}
              </button>
              <button 
                onClick={onStep} 
                className="w-8 h-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold border border-white/5"
                title="Step"
              >
                S
              </button>
              <button 
                onClick={onResolve} 
                className="w-8 h-7 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold border border-white/5"
                title="Instant Resolve"
              >
                >|
              </button>
            </div>
            
            <div className="flex flex-col gap-1 px-1 pb-1">
              <div className="flex justify-between items-center text-[7px] font-black uppercase text-slate-500 tracking-tighter">
                <span>Speed</span>
                <span className="text-cyan-500">{simSpeed}x</span>
              </div>
              <input 
                type="range"
                min="1"
                max="25"
                step="1"
                value={simSpeed}
                onChange={(e) => onSimSpeedChange(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600 focus:outline-none"
              />
            </div>
          </div>
          <div className="text-[10px] text-cyan-500 leading-none -mt-1 drop-shadow-md select-none">▼</div>
        </div>
      )}

      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-slate-900/40 border border-white/5 rounded-full backdrop-blur-xl shadow-2xl">
        <div className="hidden sm:block px-5 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 border-r border-white/10 mr-1 py-1 whitespace-nowrap">Workflow</div>
        
        {[1, 2, 3, 4, 5, 6, 7].map(step => {
          const isResetMode = step === 1 && activeStep > 1;
          const isCurrent = activeStep === step;
          const isBackwards = step < activeStep && step !== 1;
          const isSkipping = step > activeStep + 1;
          const isNext = nextStepToExecute === step;
          const isStepSimulating = isCurrent && isSimulating;
          
          const isInteractionDisabled = step !== 1 && (isCurrent || isBackwards || isSkipping);

          const getLabel = () => {
            if (isResetMode) return 'Reset';
            switch(step) {
              case 1: return 'Geo';
              case 2: return 'Hubs';
              case 3: return 'Ants';
              case 4: return 'Shapes';
              case 5: return 'Subdiv';
              case 6: return 'Traffic';
              case 7: return 'Names';
              default: return '';
            }
          };

          const isHovered = hoveredStep === step;

          return (
            <div key={step} className="relative">
              {isHovered && (STEP_INFO_MAP[step] || (step === 1 && activeStep > 1)) && (
                <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 flex flex-col items-center w-[200px] sm:w-[240px] pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="bg-slate-900/95 border border-cyan-500/30 p-2 sm:p-3 rounded-xl backdrop-blur-xl shadow-2xl">
                     <div className="text-cyan-400 text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1">
                       {step === 1 && activeStep > 1 
                         ? RESET_INFO.title 
                         : `Step ${step}: ${STEP_INFO_MAP[step].title}`}
                     </div>
                     <div className="text-slate-300 text-[8px] sm:text-[10px] leading-relaxed font-medium">
                       {step === 1 && activeStep > 1 
                         ? RESET_INFO.desc 
                         : STEP_INFO_MAP[step].desc}
                     </div>
                  </div>
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900 shadow-xl" />
                </div>
              )}

              {isStepSimulating && (
                <div className="absolute inset-[-2px] sm:inset-[-3px] rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent animate-spin z-[-1]" />
              )}

              <button
                onClick={() => !isInteractionDisabled && onExecuteStep(step)}
                onMouseEnter={() => setHoveredStep(step)}
                onMouseLeave={() => setHoveredStep(null)}
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center transition-all duration-300 border
                  ${isCurrent ? 'ring-1 sm:ring-2 ring-cyan-500 bg-cyan-900/40 border-cyan-500/50' : 'bg-slate-800/80 border-white/5'}
                  ${isNext ? 'animate-next-step border-cyan-500/50' : ''}
                  ${isInteractionDisabled ? 'opacity-20 cursor-default grayscale' : 'hover:bg-cyan-600 hover:text-white cursor-pointer'}
                  ${isResetMode ? 'bg-rose-950/40 text-rose-400 hover:bg-rose-600 hover:text-white border-rose-500/20 opacity-100 grayscale-0' : 'text-white'}
                  ${isStepSimulating ? 'shadow-[0_0_15px_rgba(34,211,238,0.3)]' : ''}
                `}
              >
                <span className="text-[10px] sm:text-xs font-black">
                  {isResetMode ? '↺' : step}
                </span>
                <span className="text-[5px] sm:text-[6px] uppercase font-bold tracking-tighter">
                  {getLabel()}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
