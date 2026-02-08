
import React, { useState } from 'react';
import engine from '../../state/engine';
import { useUIStore } from '../../state/uiStore';

export const ProfilingWindow: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  // Subscribe to tick so we re-render when engine state changes
  useUIStore((s) => s.tick);

  const logs = engine.state.profileLogs;

  const stopEvent = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className={`fixed bottom-24 right-4 w-56 ${isCollapsed ? 'h-8' : 'h-48'} bg-slate-900/80 border border-slate-800 rounded-lg backdrop-blur-md shadow-2xl flex flex-col z-[150] overflow-hidden pointer-events-auto transition-all duration-300 hidden md:flex`}
      onMouseDown={stopEvent}
      onPointerDown={stopEvent}
      onTouchStart={stopEvent}
      onWheel={stopEvent}
    >
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex-shrink-0 p-2 w-full bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center hover:bg-slate-700/60 transition-colors"
      >
        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Performance Profile</span>
        <span className="text-[8px] font-mono text-slate-600">{isCollapsed ? '+' : '−'}</span>
      </button>
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[8px] uppercase text-slate-600 font-bold italic">No logs recorded</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="p-1.5 bg-black/20 rounded border border-white/5 flex flex-col gap-0.5 group hover:border-cyan-500/30 transition-colors">
                <div className="text-[7px] font-mono text-cyan-500 truncate">{log.functionName}</div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-white">{log.duration.toFixed(2)}ms</span>
                  <span className="text-[6px] text-slate-600">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
