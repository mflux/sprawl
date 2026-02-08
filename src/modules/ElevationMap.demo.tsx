import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ElevationMap } from './ElevationMap';

const ElevationMapDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showContours, setShowContours] = useState(false);
  const [waterLevel, setWaterLevel] = useState(0.42);
  const [scale, setScale] = useState(0.015);
  const [seed] = useState(Math.random());

  const elevation = useMemo(() => new ElevationMap(seed, scale), [seed, scale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    // Light source (top-left)
    const lx = -0.5, ly = -0.5, lz = 0.707;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const height = elevation.getHeight(x, y);
        const idx = (y * w + x) * 4;

        let r, g, b;

        if (showContours) {
          const levels = 10;
          const isContour = Math.abs((height * levels) % 1) < 0.05;
          const v = height * 255;
          if (isContour) {
            r = 255; g = 255; b = 255;
          } else {
            r = v * 0.2; g = v * 0.2; b = v * 0.3;
          }
        } else {
          // Robust relief shading
          let shading = 1.0;
          if (height >= waterLevel) {
            const hL = elevation.getHeight(x - 1, y);
            const hR = elevation.getHeight(x + 1, y);
            const hU = elevation.getHeight(x, y - 1);
            const hD = elevation.getHeight(x, y + 1);
            const dx = (hR - hL) / 2;
            const dy = (hD - hU) / 2;
            const nx = -dx * 80.0, ny = -dy * 80.0, nz = 1.0;
            const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
            const dot = (nx / nLen * lx) + (ny / nLen * ly) + (nz / nLen * lz);
            shading = 0.8 + (dot - 0.5) * 0.6;
          }

          const color = elevation.getColor(height, waterLevel);
          r = parseInt(color.slice(1, 3), 16) * shading;
          g = parseInt(color.slice(3, 5), 16) * shading;
          b = parseInt(color.slice(5, 7), 16) * shading;
        }

        data[idx] = Math.min(255, Math.max(0, r));
        data[idx+1] = Math.min(255, Math.max(0, g));
        data[idx+2] = Math.min(255, Math.max(0, b));
        data[idx+3] = 255;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(5, 5, 90, 15);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(showContours ? 'CONTOUR MODE' : 'RELIEF SHADED', 50, 15);

  }, [showContours, waterLevel, scale, elevation]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded w-full">
      <div className="grid grid-cols-2 gap-2 mb-2 w-full px-1">
        <div className="flex flex-col gap-1">
           <span className="text-[6px] text-slate-500 font-bold uppercase">Scale: {scale.toFixed(3)}</span>
           <input type="range" min="0.005" max="0.05" step="0.001" value={scale} onChange={e => setScale(Number(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600" />
        </div>
        <div className="flex flex-col gap-1">
           <span className="text-[6px] text-slate-500 font-bold uppercase">Sea Level: {waterLevel.toFixed(2)}</span>
           <input type="range" min="0.1" max="0.6" step="0.01" value={waterLevel} onChange={e => setWaterLevel(Number(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600" />
        </div>
      </div>
      <button 
        onClick={() => setShowContours(!showContours)}
        className={`w-full mb-2 py-1 text-[8px] font-black uppercase rounded border transition-all ${showContours ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
      >
        Toggle Contours
      </button>
      <canvas
        ref={canvasRef}
        width={100}
        height={100}
        className="bg-slate-900 rounded border border-slate-800 w-full aspect-square max-w-[200px]"
      />
    </div>
  );
};

export default ElevationMapDemo;