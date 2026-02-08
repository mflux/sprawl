
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Vector2D } from './Vector2D';
import { ElevationMap } from './ElevationMap';
import { RiverGenerator } from './RiverGenerator';
import { River } from './River';

const RiverDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seed, setSeed] = useState(Math.random());
  const [carveDepth, setCarveDepth] = useState(0.28);
  const [showSpine, setShowSpine] = useState(true);
  
  const elevation = useMemo(() => new ElevationMap(seed, 0.01), [seed]);
  const waterLevel = 0.35;

  const river = useMemo(() => {
    let bestRiver: River | null = null;
    let maxLen = -1;

    // We want to carve from one side to the other.
    // Let's try sampling starts from various edges.
    const startEdges = [
      { side: 'top', bias: new Vector2D(0, 1) },
      { side: 'bottom', bias: new Vector2D(0, -1) },
      { side: 'left', bias: new Vector2D(1, 0) },
      { side: 'right', bias: new Vector2D(-1, 0) }
    ];

    for (const edge of startEdges) {
      for (let attempt = 0; attempt < 15; attempt++) {
        let startX = 0, startY = 0;
        if (edge.side === 'top') { startX = Math.random() * 100; startY = 5; }
        else if (edge.side === 'bottom') { startX = Math.random() * 100; startY = 95; }
        else if (edge.side === 'left') { startX = 5; startY = Math.random() * 100; }
        else if (edge.side === 'right') { startX = 95; startY = Math.random() * 100; }

        const h = elevation.getHeight(startX, startY);
        
        // Rivers prefer starting from high ground at the edges
        if (h > waterLevel + 0.1) {
          const testRiver = RiverGenerator.generate(
            elevation, 
            waterLevel, 
            new Vector2D(startX, startY), 
            1.2, 
            800, 
            edge.bias
          );
          if (testRiver && testRiver.points.length > maxLen) {
            maxLen = testRiver.points.length;
            bestRiver = testRiver;
          }
        }
      }
    }
    return bestRiver;
  }, [elevation, waterLevel]);

  const handleRegenerate = () => {
    setSeed(Math.random());
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.createImageData(w, h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let height = elevation.getHeight(x, y);
        
        const influence = river ? river.getInfluence(new Vector2D(x, y)) : 0;
        if (influence > 0) {
          height -= influence * carveDepth;
        }

        const color = elevation.getColor(height, waterLevel);
        const idx = (y * w + x) * 4;
        
        let r = parseInt(color.slice(1, 3), 16);
        let g = parseInt(color.slice(3, 5), 16);
        let b = parseInt(color.slice(5, 7), 16);

        if (influence > 0.05 && height >= waterLevel) {
           r *= (1 - influence * 0.25);
           g *= (1 - influence * 0.15);
           b *= (1 + influence * 0.4); 
        }

        imgData.data[idx] = r;
        imgData.data[idx+1] = g;
        imgData.data[idx+2] = b;
        imgData.data[idx+3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    if (river && showSpine) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      river.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, 15);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('TRANS-CONTINENTAL CARVING', 50, 10);

  }, [river, carveDepth, elevation, showSpine, waterLevel]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-3 rounded w-full">
      <div className="grid grid-cols-2 gap-3 mb-3 w-full">
        <button 
          onClick={handleRegenerate}
          className="py-1.5 bg-cyan-600 hover:bg-cyan-500 text-[8px] font-black uppercase text-white rounded transition-colors shadow-lg shadow-cyan-900/20"
        >
          Regenerate River
        </button>
        <button 
          onClick={() => setShowSpine(!showSpine)}
          className={`py-1.5 text-[8px] font-black uppercase rounded border transition-all ${showSpine ? 'bg-slate-800 border-slate-700 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
        >
          {showSpine ? 'Hide Spine' : 'Show Spine'}
        </button>
      </div>

      <div className="flex flex-col gap-1 mb-3 w-full px-1">
         <div className="flex justify-between items-center">
            <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Erosion Depth: {carveDepth.toFixed(2)}</span>
         </div>
         <input 
           type="range" min="0" max="0.5" step="0.01" 
           value={carveDepth} 
           onChange={e => setCarveDepth(Number(e.target.value))} 
           className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" 
         />
      </div>

      <div className="relative group w-full">
        <canvas
          ref={canvasRef}
          width={100}
          height={100}
          className="bg-slate-900 rounded border border-slate-800 w-full aspect-square max-w-[200px] shadow-2xl mx-auto"
        />
        {!river && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px] rounded">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Looking for clear path...</span>
          </div>
        )}
      </div>

      <p className="text-[6px] text-slate-500 mt-3 uppercase text-center leading-tight font-mono">
        Seeded on bounds with directional bias to <br/>
        encourage map-wide hydraulic traversal.
      </p>
    </div>
  );
};

export default RiverDemo;
