
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Vector2D } from './Vector2D';
import { ElevationMap } from './ElevationMap';
import { ShorelineDetector } from './ShorelineDetector';

const ShorelineDetectorDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [res, setRes] = useState(10);
  const [waterLevel, setWaterLevel] = useState(0.42);
  const [iteration, setIteration] = useState(0);

  const seed = useMemo(() => Math.random(), []);
  const elevation = useMemo(() => new ElevationMap(seed, 0.02), [seed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw Terrain
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const height = elevation.getHeight(x, y);
        const color = elevation.getColor(height, waterLevel);
        const idx = (y * w + x) * 4;
        imgData.data[idx] = parseInt(color.slice(1, 3), 16);
        imgData.data[idx+1] = parseInt(color.slice(3, 5), 16);
        imgData.data[idx+2] = parseInt(color.slice(5, 7), 16);
        imgData.data[idx+3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // 1. Draw Dense Square Matrix in Water ("Interior")
    const dotSpacing = 4; // Higher density for demo
    ctx.fillStyle = 'rgba(34, 211, 238, 0.85)'; // High opacity
    const sqSize = 1;
    for (let x = 0; x < w; x += dotSpacing) {
      for (let y = 0; y < h; y += dotSpacing) {
        if (elevation.getHeight(x, y) < waterLevel) {
          ctx.fillRect(x - sqSize / 2, y - sqSize / 2, sqSize, sqSize);
        }
      }
    }

    // Run Detection
    const shore = ShorelineDetector.detect(elevation, waterLevel, w, h, res, 0, 0);

    // Draw Shorelines
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#22d3ee';
    
    shore.forEach(seg => {
      ctx.beginPath();
      ctx.moveTo(seg.p1.x, seg.p1.y);
      ctx.lineTo(seg.p2.x, seg.p2.y);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

  }, [res, waterLevel, elevation]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded w-full">
      <div className="grid grid-cols-2 gap-2 mb-2 w-full px-1">
        <div className="flex flex-col gap-1">
           <span className="text-[6px] text-slate-500 font-bold uppercase">Resolution: {res}px</span>
           <input type="range" min="2" max="25" step="1" value={res} onChange={e => setRes(Number(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600" />
        </div>
        <div className="flex flex-col gap-1">
           <span className="text-[6px] text-slate-500 font-bold uppercase">Water Level: {waterLevel.toFixed(2)}</span>
           <input type="range" min="0.1" max="0.7" step="0.01" value={waterLevel} onChange={e => setWaterLevel(Number(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600" />
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={120}
        height={100}
        className="bg-slate-900 rounded border border-slate-800 w-full"
      />
      <div className="mt-2 text-[6px] text-slate-400 font-mono uppercase text-center leading-tight">
        Marching Squares extracting {res}px segments <br/> 
        with dense interior square matrix (technical mode).
      </div>
    </div>
  );
};

export default ShorelineDetectorDemo;
