
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { ArterialDetector } from './ArterialDetector';

const ArterialStressDemo: React.FC = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [customPoints, setCustomPoints] = useState<Vector2D[]>([]);
  const [threshold, setThreshold] = useState(50);
  const [snapStatus, setSnapStatus] = useState<Vector2D | null>(null);
  const [isHoveringExport, setIsHoveringExport] = useState(false);
  const [showAngles, setShowAngles] = useState(false);

  const scenarios = useMemo(() => {
    const userTeardrop = [
      new Vector2D(372.6, 115.4),
      new Vector2D(470.0, 239.9),
      new Vector2D(501.5, 366.9),
      new Vector2D(412.7, 456.0),
      new Vector2D(259.4, 494.0),
      new Vector2D(173.5, 418.0),
      new Vector2D(169.2, 279.2),
      new Vector2D(269.4, 171.8)
    ];

    // UNIFORM scaling to preserve angles (scale ~0.2)
    const normalizedUserTear = userTeardrop.map(p => 
      new Vector2D((p.x - 160) * 0.2 + 10, (p.y - 110) * 0.2 + 10)
    );

    return [
      {
        title: "User Teardrop (Expect 3)",
        points: normalizedUserTear,
        threshold: 50
      },
      {
        title: "Standard Square",
        points: [
          new Vector2D(20, 20),
          new Vector2D(80, 20),
          new Vector2D(80, 80), 
          new Vector2D(20, 80)
        ],
        threshold: 45
      },
      {
        title: "180° U-Turn",
        points: [
          new Vector2D(10, 20),
          new Vector2D(90, 20),
          new Vector2D(90, 25), 
          new Vector2D(10, 25)
        ],
        threshold: 60
      },
      {
        title: "Axis Wrap (No Split)",
        points: [
          new Vector2D(10, 30),
          new Vector2D(35, 27),
          new Vector2D(50, 30),
          new Vector2D(65, 33),
          new Vector2D(90, 30),
          new Vector2D(90, 60),
          new Vector2D(10, 60)
        ],
        threshold: 25
      }
    ];
  }, []);

  const copyTestData = () => {
    if (customPoints.length === 0) return;
    const formatted = customPoints.map(p => `new Vector2D(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`).join(',\n');
    const fullCode = `const customPoints = [\n${formatted}\n];`;
    navigator.clipboard.writeText(fullCode);
    setIsHoveringExport(true);
    setTimeout(() => setIsHoveringExport(false), 2000);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scaleX = e.currentTarget.width / rect.width;
    const scaleY = e.currentTarget.height / rect.height;
    return new Vector2D(x * scaleX, y * scaleY);
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    let clickPos = getCanvasCoords(e);
    const snapTarget = customPoints.find(p => p.dist(clickPos) < 20);
    if (snapTarget) clickPos = snapTarget.copy();
    setCustomPoints([...customPoints, clickPos]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoords(e);
    const snapTarget = customPoints.find(p => p.dist(pos) < 20);
    setSnapStatus(snapTarget || null);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="grid grid-cols-2 gap-3 bg-slate-950 p-2 rounded w-full">
        {scenarios.map((scen, idx) => {
          const shape = new Shape2D(scen.points);
          const arterials = ArterialDetector.detectArterialsFromShapes([shape], scen.threshold);
          return (
            <div key={idx} className="flex flex-col items-center bg-slate-900/40 p-2 border border-slate-800/60 rounded relative group">
              <div className="flex justify-between w-full mb-1">
                <span className="text-[6px] font-black text-slate-500 uppercase tracking-tighter">{scen.title}</span>
                <span className={`text-[6px] font-mono px-1 rounded ${arterials.length > 1 ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                  {arterials.length} {arterials.length === 1 ? 'Segment' : 'Segments'}
                </span>
              </div>
              <canvas
                ref={(canvas) => {
                  if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                      ctx.strokeStyle = '#1e293b'; ctx.setLineDash([1, 1]); ctx.lineWidth = 0.5;
                      ctx.beginPath();
                      shape.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                      ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
                      arterials.forEach((art, aIdx) => {
                        const hue = (aIdx * 137.5) % 360; 
                        ctx.strokeStyle = `hsla(${hue}, 85%, 60%, 1)`; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                        ctx.beginPath();
                        art.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                        if (art.closed) ctx.closePath();
                        ctx.stroke();
                        ctx.fillStyle = ctx.strokeStyle;
                        art.points.forEach((p, pIdx) => {
                          const isEnd = pIdx === 0 || pIdx === art.points.length - 1;
                          ctx.beginPath(); ctx.arc(p.x, p.y, isEnd ? 1.8 : 0.8, 0, Math.PI * 2); ctx.fill();
                        });
                      });
                    }
                  }
                }}
                width={100} height={85}
                className="bg-slate-950/80 rounded border border-slate-800 shadow-inner"
              />
            </div>
          );
        })}
      </div>

      <button onClick={() => setShowEditor(true)} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-[9px] font-black uppercase text-white rounded border border-slate-700 transition-colors">
        Open Custom Shape Editor
      </button>

      {showEditor && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/95 flex items-center justify-center p-8 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex flex-col">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Interactive Stress Tester</h3>
                <p className="text-[10px] text-slate-500">Coordinate scaling fixed. Snap: 20px.</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={showAngles} onChange={() => setShowAngles(!showAngles)} className="hidden" />
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${showAngles ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                    <div className={`absolute top-1 left-1 w-2 h-2 rounded-full bg-white transition-all ${showAngles ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 group-hover:text-slate-200">Show Angles</span>
                </label>
                <div className="flex flex-col gap-1 mx-4">
                  <span className="text-[9px] text-slate-500 font-bold uppercase text-right">Threshold: {threshold}°</span>
                  <input type="range" min="10" max="170" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-32 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                </div>
                <button onClick={copyTestData} className={`px-4 py-2 text-[10px] font-black uppercase rounded border transition-all ${isHoveringExport ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                  {isHoveringExport ? 'Copied!' : 'Copy Data'}
                </button>
                <button onClick={() => setCustomPoints([])} className="px-4 py-2 bg-slate-800 hover:bg-red-900/40 text-red-400 text-[10px] font-black uppercase rounded border border-slate-700">Clear</button>
                <button onClick={() => setShowEditor(false)} className="p-2 text-slate-500 hover:text-white transition-colors">✕</button>
              </div>
            </div>

            <div className="flex-1 relative flex">
              <div className="flex-1 bg-black/40 relative">
                <canvas onMouseDown={handleEditorClick} onMouseMove={handleMouseMove} width={800} height={600} className="w-full h-full cursor-crosshair block bg-slate-900/20"
                  ref={(canvas) => {
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.strokeStyle = 'rgba(30, 41, 59, 0.2)'; ctx.lineWidth = 1;
                        for (let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
                        for (let y = 0; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

                        if (customPoints.length > 0) {
                          const shape = new Shape2D(customPoints);
                          const arterials = ArterialDetector.detectArterialsFromShapes([shape], threshold);
                          ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
                          ctx.beginPath(); customPoints.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                          ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);

                          arterials.forEach((art, aIdx) => {
                            const hue = (aIdx * 137.5) % 360;
                            ctx.strokeStyle = `hsla(${hue}, 85%, 60%, 1)`; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                            ctx.beginPath(); art.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                            if (art.closed) ctx.closePath(); ctx.stroke();
                            ctx.fillStyle = ctx.strokeStyle;
                            art.points.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); });
                          });

                          if (showAngles && customPoints.length >= 3) {
                             customPoints.forEach((p, i) => {
                               const prev = customPoints[(i - 1 + customPoints.length) % customPoints.length];
                               const next = customPoints[(i + 1) % customPoints.length];
                               const vIn = p.sub(prev).normalize();
                               const vOut = next.sub(p).normalize();
                               const dot = Math.max(-1, Math.min(1, vIn.dot(vOut)));
                               const angle = Math.acos(dot) * (180/Math.PI);
                               
                               ctx.fillStyle = angle > threshold ? '#f43f5e' : '#64748b';
                               ctx.font = 'bold 9px Inter';
                               ctx.textAlign = 'center';
                               ctx.fillText(`${angle.toFixed(1)}°`, p.x, p.y - 8);
                             });
                          }
                        }
                        if (snapStatus) {
                          ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2;
                          ctx.beginPath(); ctx.arc(snapStatus.x, snapStatus.y, 15, 0, Math.PI * 2); ctx.stroke();
                        }
                      }
                    }
                  }}
                />
              </div>
              <div className="w-64 bg-slate-900 border-l border-slate-800 p-4 overflow-auto custom-scrollbar">
                <span className="text-[9px] font-black text-slate-500 uppercase block mb-3">Analysis (Threshold: {threshold}°)</span>
                {customPoints.length > 2 ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-black/30 rounded border border-slate-800">
                      <div className="text-white text-xs font-mono">{ArterialDetector.detectArterialsFromShapes([new Shape2D(customPoints)], threshold).length} Arterials</div>
                      <div className="text-[10px] text-slate-500 mt-1">Detected in Polygon</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] text-slate-600 font-bold uppercase">Points List</span>
                      {customPoints.map((p, i) => (
                        <div key={i} className="text-[9px] font-mono text-slate-400 bg-slate-800/40 p-1 rounded flex justify-between">
                          <span>PT{i}</span>
                          <span>{p.x.toFixed(0)}, {p.y.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-600 italic">Add at least 3 points...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArterialStressDemo;
