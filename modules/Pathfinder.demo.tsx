
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { ElevationMap } from './ElevationMap';
import { Pathfinder } from './Pathfinder';
import { RoadNetwork } from './RoadNetwork';

const PathfinderDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [startPos, setStartPos] = useState<Vector2D>(new Vector2D(20, 20));
  const [endPos, setEndPos] = useState<Vector2D>(new Vector2D(80, 80));
  const [useTerrain, setUseTerrain] = useState(true);
  const [seed] = useState(Math.random());

  const elevation = useMemo(() => new ElevationMap(seed, 0.02), [seed]);
  const waterLevel = 0.35;

  const segments = useMemo(() => {
    const segs: Segment2D[] = [];
    const hubs = [
      new Vector2D(20, 20), new Vector2D(80, 20),
      new Vector2D(50, 50), new Vector2D(20, 80), new Vector2D(80, 80)
    ];

    // Connect hubs organically
    hubs.forEach((h1, i) => {
      hubs.forEach((h2, j) => {
        if (i < j && h1.dist(h2) < 60) {
          // Add organic bridge path between hubs
          let current = h1;
          const steps = 4;
          for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            const next = h1.add(h2.sub(h1).mul(t)).add(new Vector2D((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10));
            RoadNetwork.addSegmentSnapped(current, next, segs, 5);
            current = next;
          }
          RoadNetwork.addSegmentSnapped(current, h2, segs, 5);
        }
      });
    });

    // Add some random sprawling streets
    for (let i = 0; i < 15; i++) {
      const parent = segs[Math.floor(Math.random() * segs.length)]?.p2 || hubs[0];
      const angle = Math.random() * Math.PI * 2;
      const len = 10 + Math.random() * 15;
      const child = parent.add(new Vector2D(Math.cos(angle) * len, Math.sin(angle) * len));
      RoadNetwork.addSegmentSnapped(parent, child, segs, 5);
    }

    return segs;
  }, []);

  const path = useMemo(() => {
    return Pathfinder.findPath(startPos, endPos, segments, useTerrain ? elevation : undefined, 15);
  }, [startPos, endPos, segments, useTerrain, elevation]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const clicked = new Vector2D(x, y);

    if (e.shiftKey) {
      setStartPos(clicked);
    } else {
      setEndPos(clicked);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Elevation
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const height = elevation.getHeight(x, y);
        const idx = (y * w + x) * 4;
        const color = elevation.getColor(height, waterLevel);
        imgData.data[idx] = parseInt(color.slice(1, 3), 16);
        imgData.data[idx+1] = parseInt(color.slice(3, 5), 16);
        imgData.data[idx+2] = parseInt(color.slice(5, 7), 16);
        imgData.data[idx+3] = 100;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // 2. Draw Road Network
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 0.8;
    segments.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s.p1.x, s.p1.y);
      ctx.lineTo(s.p2.x, s.p2.y);
      ctx.stroke();
    });

    // 3. Draw Nodes (Vertices)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    const nodes = new Set<string>();
    segments.forEach(s => {
      [s.p1, s.p2].forEach(p => {
        const k = `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        if (!nodes.has(k)) {
          ctx.beginPath(); ctx.arc(p.x, p.y, 0.5, 0, Math.PI * 2); ctx.fill();
          nodes.add(k);
        }
      });
    });

    // 4. Draw Path
    if (path) {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      path.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
      
      // Path nodes
      ctx.fillStyle = '#fff';
      path.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2); ctx.fill();
      });
    }

    // 5. Draw Start/End Markers
    ctx.fillStyle = '#10b981'; // Start
    ctx.beginPath(); ctx.arc(startPos.x, startPos.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = '#f43f5e'; // End
    ctx.beginPath(); ctx.arc(endPos.x, endPos.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.stroke();

    // 6. UI Text
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 5px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('SHIFT+CLICK = START | CLICK = END', 5, 92);
    ctx.fillText(path ? `PATH FOUND: ${path.length} NODES` : 'NO VALID PATH', 5, 97);

  }, [segments, elevation, path, startPos, endPos]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded w-full">
      <button 
        onClick={() => setUseTerrain(!useTerrain)}
        className={`w-full mb-2 py-1.5 text-[8px] font-black uppercase rounded border transition-all ${useTerrain ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
      >
        Cost Model: {useTerrain ? 'TOPOGRAPHY-AWARE' : 'DISTANCE ONLY'}
      </button>
      <canvas
        ref={canvasRef}
        width={100}
        height={100}
        onClick={handleCanvasClick}
        className="bg-slate-900 rounded border border-slate-800 w-full aspect-square max-w-[200px] cursor-crosshair shadow-inner"
      />
      <div className="mt-2 text-[6px] text-slate-500 font-mono uppercase text-center leading-tight">
        Pathfinding on arbitrary segment networks. <br/>
        A* snaps target coordinates to the nearest network node.
      </div>
    </div>
  );
};

export default PathfinderDemo;
