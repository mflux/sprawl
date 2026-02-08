
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Vector2D } from './Vector2D';
import { ElevationMap } from './ElevationMap';
import { TerrainFlowField } from './TerrainFlowField';

const TerrainFlowFieldDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useTerrain, setUseTerrain] = useState(true);
  const [iteration, setIteration] = useState(0);
  
  const seed = useMemo(() => Math.random(), []);
  // Use a slightly more complex terrain for better peninsula visualization
  const elevation = useMemo(() => new ElevationMap(seed, 0.02), [seed]);
  const waterLevel = 0.42;

  const tff = useMemo(() => {
    return new TerrainFlowField(elevation, waterLevel, 200, 200, 10, 0, 0);
  }, [elevation, waterLevel]);

  const particlesRef = useRef<{pos: Vector2D, life: number, history: Vector2D[]}[]>([]);

  useEffect(() => {
    particlesRef.current = Array.from({ length: 70 }, () => ({
      pos: new Vector2D(Math.random() * 100, Math.random() * 100),
      life: Math.random() * 100,
      history: []
    }));

    const timer = setInterval(() => {
      particlesRef.current.forEach(p => {
        const force = useTerrain 
          ? tff.getVectorAt(p.pos.x, p.pos.y)
          : (tff as any).grid[Math.floor(Math.abs(p.pos.x / tff.resolution)) % tff.cols][Math.floor(Math.abs(p.pos.y / tff.resolution)) % tff.rows];
        
        if (force) {
           p.pos = p.pos.add(force.mul(0.8));
           p.history.push(p.pos.copy());
           if (p.history.length > 20) p.history.shift();
        }
        
        p.life -= 0.5;
        if (p.life <= 0 || p.pos.x < 0 || p.pos.x > 100 || p.pos.y < 0 || p.pos.y > 100) {
          p.pos = new Vector2D(Math.random() * 100, Math.random() * 100);
          p.life = 40 + Math.random() * 80;
          p.history = [];
        }
      });
      setIteration(v => v + 1);
    }, 30);
    return () => clearInterval(timer);
  }, [useTerrain, tff]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw Background
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const height = elevation.getHeight(x, y);
        const idx = (y * w + x) * 4;
        const color = elevation.getColor(height, waterLevel);
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        imgData.data[idx] = r;
        imgData.data[idx+1] = g;
        imgData.data[idx+2] = b;
        imgData.data[idx+3] = 140;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Draw Trails with fading
    particlesRef.current.forEach(p => {
      if (p.history.length < 2) return;
      ctx.beginPath();
      ctx.lineWidth = 1.2;
      const alpha = Math.min(0.4, p.life / 50);
      ctx.strokeStyle = useTerrain ? `rgba(34, 211, 238, ${alpha})` : `rgba(245, 158, 11, ${alpha})`;
      ctx.moveTo(p.history[0].x, p.history[0].y);
      for (let i = 1; i < p.history.length; i++) {
        ctx.lineTo(p.history[i].x, p.history[i].y);
      }
      ctx.stroke();
    });

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.fillStyle = useTerrain ? '#22d3ee' : '#f59e0b';
      ctx.globalAlpha = Math.min(1, p.life / 20);
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

  }, [iteration, useTerrain, elevation, tff]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded w-full">
      <button 
        onClick={() => setUseTerrain(!useTerrain)}
        className={`w-full mb-2 py-1.5 text-[8px] font-black uppercase rounded border transition-all ${useTerrain ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
      >
        {useTerrain ? 'Enabled: Curvature-Aware Sliding' : 'Disabled: Noise Only'}
      </button>
      <canvas
        ref={canvasRef}
        width={100}
        height={100}
        className="bg-slate-900 rounded border border-slate-800 w-full aspect-square max-w-[200px]"
      />
      <div className="mt-2 text-[6px] text-slate-400 font-mono uppercase text-center leading-tight">
        Noise-Aligned Tangents ensure agents turn corners <br/> 
        smoothly instead of getting trapped at headlands.
      </div>
    </div>
  );
};

export default TerrainFlowFieldDemo;
