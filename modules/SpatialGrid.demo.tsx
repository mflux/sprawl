
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Vector2D } from './Vector2D';
import { SpatialGrid } from './SpatialGrid';

const SpatialGridDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState<Vector2D>(new Vector2D(50, 50));
  const [queryRadius, setQueryRadius] = useState(25);
  const [cellSize, setCellSize] = useState(25);
  
  const points = useMemo(() => {
    return Array.from({ length: 80 }, () => new Vector2D(Math.random() * 100, Math.random() * 100));
  }, []);

  const grid = useMemo(() => {
    const g = new SpatialGrid<Vector2D>(cellSize);
    points.forEach(p => g.insert(p, p));
    return g;
  }, [points, cellSize]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos(new Vector2D(x, y));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Grid Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= 100; x += cellSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 100); ctx.stroke();
    }
    for (let y = 0; y <= 100; y += cellSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(100, y); ctx.stroke();
    }

    // Query result
    const startTime = performance.now();
    const neighbors = grid.query(mousePos, queryRadius, (p) => p);
    const endTime = performance.now();

    // Highlight scanned cells (the cells intersected by the query radius)
    const minGx = Math.floor((mousePos.x - queryRadius) / cellSize);
    const maxGx = Math.floor((mousePos.x + queryRadius) / cellSize);
    const minGy = Math.floor((mousePos.y - queryRadius) / cellSize);
    const maxGy = Math.floor((mousePos.y + queryRadius) / cellSize);
    
    ctx.fillStyle = 'rgba(34, 211, 238, 0.05)';
    for (let gx = minGx; gx <= maxGx; gx++) {
      for (let gy = minGy; gy <= maxGy; gy++) {
        ctx.fillRect(gx * cellSize, gy * cellSize, cellSize, cellSize);
      }
    }

    // Draw Query Circle
    ctx.strokeStyle = '#22d3ee';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.arc(mousePos.x, mousePos.y, queryRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Points
    points.forEach(p => {
      const isNeighbor = neighbors.includes(p);
      ctx.fillStyle = isNeighbor ? '#22d3ee' : '#475569';
      ctx.beginPath();
      ctx.arc(p.x, p.y, isNeighbor ? 1.5 : 0.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Stats
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 5px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`Search Time: ${(endTime - startTime).toFixed(4)}ms`, 5, 90);
    ctx.fillText(`Neighbors: ${neighbors.length}`, 5, 96);

  }, [mousePos, queryRadius, cellSize, grid, points]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded w-full">
      <div className="flex gap-4 mb-2 w-full px-2">
         <div className="flex-1 flex flex-col gap-1">
            <span className="text-[6px] text-slate-500 font-bold uppercase">Cell Size: {cellSize}</span>
            <input type="range" min="5" max="50" value={cellSize} onChange={e => setCellSize(Number(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600" />
         </div>
         <div className="flex-1 flex flex-col gap-1">
            <span className="text-[6px] text-slate-500 font-bold uppercase">Radius: {queryRadius}</span>
            <input type="range" min="5" max="50" value={queryRadius} onChange={e => setQueryRadius(Number(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600" />
         </div>
      </div>
      <canvas
        ref={canvasRef}
        width={100}
        height={100}
        onMouseMove={handleMouseMove}
        className="bg-slate-900 rounded border border-slate-800 cursor-crosshair w-full aspect-square max-w-[200px]"
      />
    </div>
  );
};

export default SpatialGridDemo;
