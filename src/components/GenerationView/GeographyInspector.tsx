
import React from 'react';
import engine from '../../state/engine';
import { useUIStore } from '../../state/uiStore';

export const GeographyInspector: React.FC = () => {
  const bumpTick = useUIStore((s) => s.bumpTick);
  // Subscribe to tick so we re-render when engine state changes
  useUIStore((s) => s.tick);

  const geo = engine.state.geography;

  const setHovered = (id: string | null) => {
    engine.state.hoveredGeoId = id;
    bumpTick();
  };

  return (
    <div className="flex flex-col min-h-0 p-3 pt-0 overflow-y-auto custom-scrollbar bg-black/20">
      <div className="py-2 space-y-3">
        <div>
          <span className="text-[6px] font-black text-cyan-500 uppercase block mb-1 tracking-wider">Hubs ({geo.hubs.length})</span>
          {geo.hubs.map(h => (
            <div 
              key={h.id} 
              className="text-[7px] font-mono text-slate-400 mb-0.5 border-l border-cyan-500/20 pl-1 cursor-crosshair hover:bg-white/5 transition-colors"
              onMouseEnter={() => setHovered(h.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="text-slate-600">{h.id}:</span> <span className={h.name ? 'text-cyan-400 font-bold' : 'italic'}>{h.name || 'Unnamed'}</span>
            </div>
          ))}
        </div>
        <div>
          <span className="text-[6px] font-black text-white uppercase block mb-1 tracking-wider">Infrastructure ({geo.bridges.length})</span>
          {geo.bridges.map(b => (
            <div 
              key={b.id} 
              className="text-[7px] font-mono text-slate-400 mb-0.5 border-l border-white/20 pl-1 cursor-crosshair hover:bg-white/5 transition-colors"
              onMouseEnter={() => setHovered(b.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="text-slate-600">{b.id}:</span> <span className={b.name ? 'text-slate-200 font-bold' : 'italic'}>{b.name || 'Unnamed'}</span>
            </div>
          ))}
        </div>
        <div>
          <span className="text-[6px] font-black text-sky-500 uppercase block mb-1 tracking-wider">Water ({geo.waterBodies.length})</span>
          {geo.waterBodies.map(w => (
            <div 
              key={w.id} 
              className="text-[7px] font-mono text-slate-400 mb-0.5 border-l border-sky-500/20 pl-1 cursor-crosshair hover:bg-white/5 transition-colors"
              onMouseEnter={() => setHovered(w.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="text-slate-600">{w.id}:</span> <span className={w.name ? 'text-sky-400 font-bold' : 'italic'}>{w.name || 'Unnamed'}</span>
            </div>
          ))}
        </div>
        <div>
          <span className="text-[6px] font-black text-slate-500 uppercase block mb-1 tracking-wider">Districts ({geo.notableShapes.length})</span>
          {geo.notableShapes.map(s => (
            <div 
              key={s.id} 
              className="text-[7px] font-mono text-slate-400 mb-0.5 border-l border-slate-500/20 pl-1 cursor-crosshair hover:bg-white/5 transition-colors"
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="text-slate-600">{s.id}:</span> <span className={s.name ? 'text-white font-bold' : 'italic'}>{s.name || 'Unnamed'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
