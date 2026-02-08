
import React from 'react';
import { SimEvent } from '../../types';

interface EventFeedProps {
  events: SimEvent[];
}

export const EventFeed: React.FC<EventFeedProps> = ({ events }) => {
  return (
    <div className="fixed top-14 right-4 w-48 max-h-[40vh] overflow-hidden pointer-events-none z-[150]">
      <div className="space-y-1 flex flex-col-reverse">
        {events.filter(e => e.type !== 'trail_left').slice(-10).map(ev => (
          <div key={ev.id} className="bg-slate-900/60 border border-white/5 p-1.5 rounded animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="flex justify-between items-center">
              <span className={`text-[7px] font-black uppercase tracking-tighter ${
                ev.type === 'death_collision' ? 'text-rose-500' : 
                ev.type === 'target_reached' ? 'text-emerald-500' :
                ev.type === 'spawn' ? 'text-cyan-500' : 
                ev.type === 'shapes_merged' ? 'text-indigo-400' : 
                ev.type === 'death_stale' ? 'text-amber-600' :
                'text-slate-400'
              }`}>
                {ev.type.replace('_', ' ')}
              </span>
              <span className="text-[6px] text-slate-600 font-mono">
                {new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, second: '2-digit' })}
              </span>
            </div>
            {ev.data?.message && (
              <div className="text-[6px] text-slate-500 mt-0.5 font-medium leading-tight truncate">
                {ev.data.message}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
