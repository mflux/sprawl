
import React, { useState, useEffect } from 'react';
import engine from '../../state/engine';

export const RenderProfiler: React.FC = () => {
  const [show, setShow] = useState(false);
  const [localTimings, setLocalTimings] = useState<Record<string, number>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTimings({ ...engine.state.renderTimings });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  if (!show) {
    return (
      <button 
        onClick={() => setShow(true)}
        className="fixed top-16 right-4 z-[200] px-3 py-1 bg-slate-900/60 border border-slate-800 rounded text-[8px] font-black uppercase text-slate-500 hover:text-cyan-400 backdrop-blur-md transition-all pointer-events-auto hidden md:block"
      >
        GPU Monitor
      </button>
    );
  }

  const entries = (Object.entries(localTimings) as [string, number][]);
  const renderEntries = entries.filter(([key]) => key.includes('_RENDER') && key !== 'RENDER_TOTAL');
  const bakeEntries = entries.filter(([key]) => key.includes('_BAKE') || key.includes('_INIT'));

  const renderTotal = localTimings['RENDER_TOTAL'] || 1;
  const fps = Math.round(1000 / renderTotal);

  const stopEvent = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div 
      className="fixed top-16 right-4 z-[200] w-52 bg-slate-900/90 border border-slate-800 rounded-lg backdrop-blur-xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col hidden md:flex"
      onMouseDown={stopEvent}
      onPointerDown={stopEvent}
    >
      <div className="flex items-center justify-between p-2 bg-slate-800/50 border-b border-slate-700/50">
        <span className="text-[9px] font-black uppercase text-white tracking-[0.1em]">Render Pipeline</span>
        <button onClick={() => setShow(false)} className="text-slate-500 hover:text-white text-xs">✕</button>
      </div>

      <div className="p-3 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-baseline border-b border-white/5 pb-1 mb-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Real-Time Draw</span>
            <span className={`text-[10px] font-mono font-bold ${fps > 45 ? 'text-emerald-500' : fps > 25 ? 'text-amber-500' : 'text-rose-500'}`}>{fps} FPS</span>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-48 custom-scrollbar pr-1">
            <div className="flex justify-between text-[11px] font-black text-white mb-1">
              <span>Total Render</span>
              <span>{renderTotal.toFixed(2)}ms</span>
            </div>
            {renderEntries.sort((a,b) => b[1] - a[1]).map(([name, time]) => {
              const percentage = (time / renderTotal) * 100;
              return (
                <div key={name} className="space-y-0.5 group">
                  <div className="flex justify-between text-[7px] font-mono">
                    <span className="text-slate-400 group-hover:text-slate-200 uppercase">{name.replace('_RENDER', '')}</span>
                    <span className="text-slate-500 font-bold">{time.toFixed(2)}ms</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-600/80 transition-all duration-300" 
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {bakeEntries.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">Synthesis Pipeline (Bake)</span>
            <div className="space-y-1">
              {bakeEntries.map(([name, time]) => (
                <div key={name} className="flex justify-between text-[7px] font-mono">
                  <span className="text-slate-500 uppercase truncate pr-2">{name}</span>
                  <span className="text-indigo-400 font-bold">{time.toFixed(1)}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-2 bg-black/40 text-[7px] text-slate-600 font-medium uppercase tracking-tighter text-center">
        Cycle latency sampled per-frame
      </div>
    </div>
  );
};
