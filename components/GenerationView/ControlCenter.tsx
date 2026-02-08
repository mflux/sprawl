
import React, { useState } from 'react';
import { GenerationState } from '../../types';
import { GeographyInspector } from './GeographyInspector';
import { VisualizationControls } from './VisualizationControls';
import { SimulationSettingsControls } from './SimulationSettingsControls';

interface ControlCenterProps {
  state: GenerationState;
  onSettingChange: () => void;
}

export const ControlCenter: React.FC<ControlCenterProps> = ({ 
  state, 
  onSettingChange 
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showViz, setShowViz] = useState(false);
  const [showGeo, setShowGeo] = useState(false);

  const stopEvent = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed top-16 left-4 flex flex-col gap-2 z-[150] w-[220px] max-h-[calc(100vh-100px)]"
      onMouseDown={stopEvent}
      onPointerDown={stopEvent}
      onTouchStart={stopEvent}
      onWheel={stopEvent}
    >
      <div className="flex flex-col min-h-0 bg-slate-900/80 border border-slate-800 rounded-lg backdrop-blur-md shadow-2xl overflow-hidden">
        {/* Geography Inspector */}
        <button 
          onClick={() => setShowGeo(!showGeo)} 
          className="flex-shrink-0 p-2.5 w-full flex items-center justify-between text-[9px] font-black uppercase text-slate-400 tracking-widest hover:text-white transition-colors border-b border-slate-800/50"
        >
          <span>Geography Inspector</span>
          <span className="text-xs">{showGeo ? '−' : '+'}</span>
        </button>
        {showGeo && (
          <GeographyInspector state={state} onUpdate={onSettingChange} />
        )}

        {/* Visualizations Panel */}
        <button 
          onClick={() => setShowViz(!showViz)} 
          className="flex-shrink-0 p-2.5 w-full flex items-center justify-between text-[9px] font-black uppercase text-slate-400 tracking-widest hover:text-white transition-colors border-t border-slate-800/50"
        >
          <span>Visualizations</span>
          <span className="text-xs">{showViz ? '−' : '+'}</span>
        </button>
        {showViz && (
          <VisualizationControls state={state} onUpdate={onSettingChange} />
        )}

        {/* Global Settings Panel */}
        <button 
          onClick={() => setShowSettings(!showSettings)} 
          className="flex-shrink-0 p-2.5 w-full flex items-center justify-between text-[9px] font-black uppercase text-slate-400 tracking-widest hover:text-white transition-colors border-t border-slate-800/50"
        >
          <span>Global Settings</span>
          <span className="text-xs">{showSettings ? '−' : '+'}</span>
        </button>
        {showSettings && (
          <SimulationSettingsControls state={state} onUpdate={onSettingChange} />
        )}
      </div>
    </div>
  );
};
