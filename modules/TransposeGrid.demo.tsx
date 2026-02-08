
import React, { useState, useMemo } from 'react';
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { TransposeGrid } from './TransposeGrid';

const TransposeGridDemo: React.FC = () => {
  const [rotation, setRotation] = useState(0.2);
  const [spacing, setSpacing] = useState(15);
  const [warpIntensity, setWarpIntensity] = useState(8);
  const [relaxIters, setRelaxIters] = useState(3);
  const [showRaw, setShowRaw] = useState(false);
  const [enableSnap, setEnableSnap] = useState(true);

  // A fixed interesting shape to clip against
  const shape = useMemo(() => new Shape2D([
    new Vector2D(20, 20),
    new Vector2D(80, 10),
    new Vector2D(90, 50),
    new Vector2D(50, 90),
    new Vector2D(10, 60)
  ]), []);

  const data = useMemo(() => {
    const center = new Vector2D(50, 50);
    const raw = TransposeGrid.generateRawGrid(
      center, 
      120, 
      120, 
      spacing, 
      spacing, 
      rotation,
      warpIntensity,
      relaxIters
    );
    const snapThreshold = enableSnap ? 8 : 0;
    const clipped = TransposeGrid.clipGridToShape(raw, shape, snapThreshold);
    return { raw, clipped };
  }, [rotation, spacing, shape, enableSnap, warpIntensity, relaxIters]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-3 rounded w-full">
      <div className="flex flex-col gap-2 mb-3 w-full px-2">
        <div className="flex justify-between items-center">
          <span className="text-[7px] font-black uppercase text-slate-500 tracking-widest">Rotation: {(rotation * 180 / Math.PI).toFixed(0)}°</span>
          <input type="range" min="0" max={Math.PI} step="0.05" value={rotation} onChange={e => setRotation(Number(e.target.value))} className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600" />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[7px] font-black uppercase text-slate-500 tracking-widest">Warp: {warpIntensity}px</span>
          <input type="range" min="0" max="25" step="1" value={warpIntensity} onChange={e => setWarpIntensity(Number(e.target.value))} className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[7px] font-black uppercase text-slate-500 tracking-widest">Relax: {relaxIters} iters</span>
          <input type="range" min="0" max="15" step="1" value={relaxIters} onChange={e => setRelaxIters(Number(e.target.value))} className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
        </div>
        
        <div className="flex gap-4 mt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showRaw} onChange={() => setShowRaw(!showRaw)} className="w-3 h-3 accent-cyan-600" />
            <span className="text-[7px] font-black uppercase text-slate-400">Show Raw</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={enableSnap} onChange={() => setEnableSnap(!enableSnap)} className="w-3 h-3 accent-cyan-600" />
            <span className={`text-[7px] font-black uppercase transition-colors ${enableSnap ? 'text-cyan-400' : 'text-slate-500'}`}>Sliver Reduction</span>
          </label>
        </div>
      </div>

      <canvas
        ref={(canvas) => {
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              // 1. Draw Shape Boundary
              ctx.strokeStyle = '#334155';
              ctx.lineWidth = 1;
              ctx.beginPath();
              shape.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
              ctx.closePath();
              ctx.stroke();

              // 2. Draw Raw Grid (Faint)
              if (showRaw) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.lineWidth = 0.5;
                data.raw.forEach(seg => {
                  ctx.beginPath();
                  ctx.moveTo(seg.p1.x, seg.p1.y);
                  ctx.lineTo(seg.p2.x, seg.p2.y);
                  ctx.stroke();
                });
              }

              // 3. Draw Clipped Grid
              ctx.strokeStyle = '#22d3ee';
              ctx.lineWidth = 1.5;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              data.clipped.forEach(seg => {
                ctx.beginPath();
                ctx.moveTo(seg.p1.x, seg.p1.y);
                ctx.lineTo(seg.p2.x, seg.p2.y);
                ctx.stroke();
              });

              // 4. Draw Intersection Nodes
              ctx.fillStyle = '#fff';
              data.clipped.forEach(seg => {
                ctx.beginPath(); ctx.arc(seg.p1.x, seg.p1.y, 0.6, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(seg.p2.x, seg.p2.y, 0.6, 0, Math.PI * 2); ctx.fill();
              });
              
              // 5. Highlight shape vertices
              ctx.fillStyle = '#64748b';
              shape.points.forEach(p => {
                ctx.beginPath(); ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2); ctx.fill();
              });
            }
          }
        }}
        width={100}
        height={100}
        className="bg-slate-900 rounded border border-slate-800 w-full aspect-square max-w-[200px]"
      />
      <div className="mt-2 text-[6px] text-slate-500 font-mono uppercase text-center leading-tight">
        Organic mesh deformation via Noise Warp and Laplacian Relaxation.
      </div>
    </div>
  );
};

export default TransposeGridDemo;
