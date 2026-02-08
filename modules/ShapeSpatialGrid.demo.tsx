import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { ShapeSpatialGrid } from './ShapeSpatialGrid';
import { getPathBounds } from './Culling';

const ShapeSpatialGridDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState<Vector2D>(new Vector2D(50, 50));
  const [cellSize, setCellSize] = useState(25);

  const shapes = useMemo(() => {
    const list: Shape2D[] = [];
    for (let i = 0; i < 15; i++) {
      const center = new Vector2D(Math.random() * 100, Math.random() * 100);
      const pts: Vector2D[] = [];
      const sides = 3 + Math.floor(Math.random() * 4);
      const rad = 5 + Math.random() * 15;
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2;
        pts.push(center.add(new Vector2D(Math.cos(a) * rad, Math.sin(a) * rad)));
      }
      list.push(new Shape2D(pts));
    }
    return list;
  }, []);

  const grid = useMemo(() => {
    const g = new ShapeSpatialGrid(cellSize);
    shapes.forEach(s => g.insert(s));
    return g;
  }, [shapes, cellSize]);

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

    const candidates = grid.queryCandidates(mousePos);
    const contained = grid.findShapeAt(mousePos);

    // 1. Draw Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= 100; x += cellSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 100); ctx.stroke();
    }
    for (let y = 0; y <= 100; y += cellSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(100, y); ctx.stroke();
    }

    // 2. Highlight Active Cell
    const gx = Math.floor(mousePos.x / cellSize);
    const gy = Math.floor(mousePos.y / cellSize);
    ctx.fillStyle = 'rgba(34, 211, 238, 0.1)';
    ctx.fillRect(gx * cellSize, gy * cellSize, cellSize, cellSize);

    // 3. Draw Shapes
    shapes.forEach(s => {
      const isCandidate = candidates.includes(s);
      const isContained = s === contained;
      const bounds = getPathBounds(s.points);

      // Draw AABB for candidates
      if (isCandidate) {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
        ctx.setLineDash([1, 1]);
        ctx.strokeRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
        ctx.setLineDash([]);
      }

      // Draw Shape
      ctx.beginPath();
      s.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.closePath();

      if (isContained) {
        ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
      } else if (isCandidate) {
        ctx.fillStyle = 'rgba(34, 211, 238, 0.2)';
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1;
      } else {
        ctx.fillStyle = 'rgba(51, 65, 85, 0.1)';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 0.5;
      }
      ctx.fill();
      ctx.stroke();
    });

    // 4. Pointer
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(mousePos.x, mousePos.y, 1, 0, Math.PI * 2); ctx.fill();

    // 5. Stats
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 5px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`TOTAL SHAPES: ${shapes.length}`, 5, 90);
    ctx.fillText(`CANDIDATES: ${candidates.length}`, 5, 96);

  }, [mousePos, cellSize, grid, shapes]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded w-full">
      <div className="flex flex-col gap-1 mb-2 w-full px-2">
        <span className="text-[6px] text-slate-500 font-bold uppercase">Grid Resolution: {cellSize}px</span>
        <input type="range" min="10" max="50" value={cellSize} onChange={e => setCellSize(Number(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600" />
      </div>
      <canvas
        ref={canvasRef}
        width={100}
        height={100}
        onMouseMove={handleMouseMove}
        className="bg-slate-900 rounded border border-slate-800 cursor-crosshair w-full aspect-square max-w-[200px]"
      />
      <div className="mt-2 text-[6px] text-slate-500 font-mono uppercase text-center leading-tight">
        Candidates (light blue) are shapes whose AABBs overlap the current cell. <br/>
        Only these shapes undergo expensive point-in-polygon testing.
      </div>
    </div>
  );
};

export default ShapeSpatialGridDemo;
