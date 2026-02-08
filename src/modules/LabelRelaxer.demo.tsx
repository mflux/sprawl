import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Vector2D } from './Vector2D';
import { LabelRelaxer, Label } from './LabelRelaxer';

const LabelRelaxerDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showRelaxed, setShowRelaxed] = useState(true);
  const [buffer, setBuffer] = useState(12);

  const rawLabels = useMemo(() => {
    const list: Label[] = [];
    const centers = [
      new Vector2D(30, 30),
      new Vector2D(70, 70),
      new Vector2D(50, 50),
      new Vector2D(45, 45), // Overlaps with 50,50
      new Vector2D(55, 52), // Overlaps with 50,50
    ];

    const names = ["Downtown", "Old Harbor", "Central Park", "Market District", "High Street"];

    centers.forEach((c, i) => {
      const text = names[i];
      const dims = LabelRelaxer.estimateDimensions(text, 1.0);
      list.push({
        id: `l-${i}`,
        anchor: c.copy(),
        pos: c.copy(),
        width: dims.width,
        height: dims.height,
        ref: text
      });
    });
    return list;
  }, []);

  const relaxedLabels = useMemo(() => {
    return LabelRelaxer.relax(rawLabels, 100, buffer);
  }, [rawLabels, buffer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const labels = showRelaxed ? relaxedLabels : rawLabels;

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for(let i=0; i<=100; i+=20) {
      ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,100); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(100,i); ctx.stroke();
    }

    labels.forEach(l => {
      // Draw anchor
      ctx.fillStyle = '#64748b';
      ctx.beginPath(); ctx.arc(l.anchor.x, l.anchor.y, 1.5, 0, Math.PI * 2); ctx.fill();

      // Draw connection line
      if (showRelaxed) {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
        ctx.setLineDash([2, 1]);
        ctx.beginPath(); ctx.moveTo(l.anchor.x, l.anchor.y); ctx.lineTo(l.pos.x, l.pos.y); ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw label box
      ctx.fillStyle = showRelaxed ? 'rgba(34, 211, 238, 0.1)' : 'rgba(244, 63, 94, 0.1)';
      ctx.strokeStyle = showRelaxed ? '#22d3ee' : '#f43f5e';
      ctx.lineWidth = 0.8;
      const rx = l.pos.x - l.width / 2;
      const ry = l.pos.y - l.height / 2;
      ctx.fillRect(rx, ry, l.width, l.height);
      ctx.strokeRect(rx, ry, l.width, l.height);

      // Draw Text
      ctx.fillStyle = '#fff';
      ctx.font = '5px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(l.ref as string, l.pos.x, l.pos.y);
    });

  }, [showRelaxed, rawLabels, relaxedLabels, buffer]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded w-full">
      <div className="flex flex-col gap-2 mb-3 w-full px-1">
        <div className="flex justify-between items-center">
          <span className="text-[7px] font-black uppercase text-slate-500 tracking-widest">Overlap Buffer: {buffer}px</span>
          <input type="range" min="0" max="30" step="1" value={buffer} onChange={e => setBuffer(Number(e.target.value))} className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600" />
        </div>
        <button 
          onClick={() => setShowRelaxed(!showRelaxed)}
          className={`w-full py-1.5 text-[8px] font-black uppercase rounded border transition-all ${showRelaxed ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-900/20' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
        >
          {showRelaxed ? 'View Relaxed State' : 'View Colliding State'}
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={100}
        height={100}
        className="bg-slate-900 rounded border border-slate-800 w-full aspect-square max-w-[200px]"
      />
      <div className="mt-2 text-[6px] text-slate-500 font-mono uppercase text-center leading-tight">
        A spring-repulsion simulation pushes text boxes <br/>
        apart while maintaining connection to spatial anchors.
      </div>
    </div>
  );
};

export default LabelRelaxerDemo;