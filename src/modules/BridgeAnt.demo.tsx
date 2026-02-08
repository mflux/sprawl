
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Vector2D } from './Vector2D';
import { Ant } from './Ant';
import { ElevationMap } from './ElevationMap';
import { RoadNetwork } from './RoadNetwork';
import { Segment2D } from './Segment2D';

const BridgeAntDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [iteration, setIteration] = useState(0);
  const dataRef = useRef<{ ants: Ant[], roads: Segment2D[] }>({ ants: [], roads: [] });

  const waterLevel = 0.45;
  const elevation = useMemo(() => new ElevationMap(0.123, 0.05), []);

  const reset = () => {
    // Two landmasses separated by a channel
    // Left land: x < 35
    // Right land: x > 65
    // Channel: 35 to 65
    const start = new Vector2D(20, 50);
    const target = new Vector2D(80, 50);
    
    const bridge = new Ant(start, target, {
      type: 'bridge',
      speed: 1.5,
      life: 500,
      trailDistance: 10,
      wanderIntensity: 0
    });
    
    dataRef.current = { ants: [bridge], roads: [] };
  };

  useEffect(() => {
    reset();
    const timer = setInterval(() => {
      const { ants, roads } = dataRef.current;
      ants.forEach(ant => {
        if (ant.isAlive) {
          const result = ant.update();
          if (result === 'trail_left' || result === 'target_reached') {
             RoadNetwork.addSegmentSnapped(ant.lastTrailPos, ant.position, roads, 4);
             ant.commitTrail();
          }
        }
      });
      setIteration(v => v + 1);
      if (ants.every(a => !a.isAlive)) {
        setTimeout(reset, 1500);
      }
    }, 32);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Terrain
    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const height = (x > 35 && x < 65) ? 0.2 : 0.7; // Simple custom channel
        const color = elevation.getColor(height, waterLevel);
        const idx = (y * w + x) * 4;
        imgData.data[idx] = parseInt(color.slice(1, 3), 16);
        imgData.data[idx+1] = parseInt(color.slice(3, 5), 16);
        imgData.data[idx+2] = parseInt(color.slice(5, 7), 16);
        imgData.data[idx+3] = 180;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Draw Roads (Bridges)
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    dataRef.current.roads.forEach(r => {
      ctx.beginPath();
      ctx.moveTo(r.p1.x, r.p1.y);
      ctx.lineTo(r.p2.x, r.p2.y);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // Draw Ant
    dataRef.current.ants.forEach(ant => {
      if (!ant.isAlive) return;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ant.position.x, ant.position.y, 3, 0, Math.PI * 2); ctx.fill();
      
      // Target marker
      ctx.strokeStyle = '#f43f5e';
      ctx.beginPath(); ctx.arc(ant.targetPos.x, ant.targetPos.y, 2, 0, Math.PI * 2); ctx.stroke();
    });

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 6px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('WHITE BRIDGE ANT CROSSING CHANNEL', 50, 10);

  }, [iteration]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded">
      <canvas ref={canvasRef} width={100} height={100} className="bg-slate-900 rounded border border-slate-800" />
    </div>
  );
};

export default BridgeAntDemo;
