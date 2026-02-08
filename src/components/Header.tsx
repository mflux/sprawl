
import React from 'react';
import { AppView } from '../types';

interface HeaderProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  const stopEvent = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <header 
      className="fixed top-4 left-4 right-4 flex items-center justify-between z-[200] pointer-events-none"
      onMouseDown={stopEvent}
      onPointerDown={stopEvent}
      onTouchStart={stopEvent}
    >
      <div 
        className="flex items-center gap-2 cursor-pointer pointer-events-auto bg-slate-900/40 backdrop-blur-md border border-white/5 px-3 py-1.5 rounded-full shadow-2xl hover:bg-slate-800/60 transition-colors" 
        onClick={() => setView('generation')}
      >
        <div className="w-5 h-5 bg-cyan-600 rounded-full flex items-center justify-center font-bold text-[10px] text-white">U</div>
        <span className="text-xs font-bold text-white uppercase tracking-wider ml-1 hidden md:block">UrbanGenesis</span>
      </div>
      
      <nav className="flex gap-2 p-1.5 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-full shadow-2xl pointer-events-auto">
        <button 
          onClick={() => setView('generation')} 
          className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold transition-all ${currentView === 'generation' ? 'bg-cyan-600/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Generation
        </button>
        <button 
          onClick={() => setView('concepts')} 
          className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold transition-all ${currentView === 'concepts' ? 'bg-cyan-600/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Concepts
        </button>
      </nav>
    </header>
  );
};
