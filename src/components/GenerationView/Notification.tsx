
import React from 'react';

interface NotificationProps { message: string | null; onClose?: () => void; }

export const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {
  if (!message) return null;
  const stopEvent = (e: React.SyntheticEvent) => { e.stopPropagation(); };
  return (
    <div 
      className="fixed top-14 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/90 border border-cyan-500/40 rounded-lg text-[10px] font-bold uppercase tracking-widest text-cyan-400 backdrop-blur-md z-[1000] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300"
      onMouseDown={stopEvent}
      onPointerDown={stopEvent}
      onTouchStart={stopEvent}
    >
      <div className="flex-1">{message}</div>
      {onClose && (
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white">✕</button>
      )}
    </div>
  );
};
