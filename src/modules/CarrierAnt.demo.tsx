
import React, { useEffect, useRef, useState } from 'react';
import { Vector2D } from './Vector2D';
import { Ant } from './Ant';
import { Segment2D } from './Segment2D';
import { RoadNetwork } from './RoadNetwork';

const CarrierDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [iteration, setIteration] = useState(0);
  const [spacing, setSpacing] = useState(30);
  const [speed, setSpeed] = useState(1.2);
  
  const dataRef = useRef<{ 
    ants: Ant[], 
    roads: Segment2D[],
    forkCount: number 
  }>({ ants: [], roads: [], forkCount: 0 });

  const reset = () => {
    const start = new Vector2D(10, 50);
    const target = new Vector2D(110, 50);
    const carrier = new Ant(start, target, {
      type: 'carrier',
      speed: speed,
      life: 500,
      trailDistance: 10,
      wanderIntensity: 0.001
    });
    dataRef.current = { ants: [carrier], roads: [], forkCount: 0 };
  };

  useEffect(() => {
    reset();
    const timer = setInterval(() => {
      const { ants, roads } = dataRef.current;
      const newAnts: Ant[] = [];

      for (let i = ants.length - 1; i >= 0; i--) {
        const ant = ants[i];
        if (!ant.isAlive) continue;

        const oldPos = ant.position.copy();
        const result = ant.update();
        
        if (result === 'trail_left') {
          RoadNetwork.addSegmentSnapped(ant.lastTrailPos, ant.position, roads, 2);
          
          // FORKING LOGIC (Isolated for demo clarity)
          if (ant.type === 'carrier' && ant.distanceSinceLastFork >= spacing) {
            [1, -1].forEach(side => {
              const turnAngle = Math.PI / 2;
              const newDir = new Vector2D(
                ant.direction.x * Math.cos(turnAngle * side) - ant.direction.y * Math.sin(turnAngle * side),
                ant.direction.x * Math.sin(turnAngle * side) + ant.direction.y * Math.cos(turnAngle * side)
              );
              
              const fork = new Ant(ant.position.copy(), ant.position.add(newDir.mul(1000)), {
                type: 'fork',
                speed: speed * 0.9,
                life: 30,
                turnSpeed: 0,
                initialDirection: newDir,
                trailDistance: 8,
                wanderIntensity: 0
              });
              newAnts.push(fork);
            });
            ant.distanceSinceLastFork = 0;
            dataRef.current.forkCount++;
          }
          ant.commitTrail();
        }

        if (ant.position.x < 0 || ant.position.x > 120 || ant.position.y < 0 || ant.position.y > 100) {
          ant.kill();
        }
      }

      dataRef.current.ants.push(...newAnts);
      setIteration(v => v + 1);

      if (dataRef.current.ants.every(a => !a.isAlive)) {
        setTimeout(reset, 1500);
      }
    }, 32);
    return () => clearInterval(timer);
  }, [spacing, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Background Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for(let i=0; i<=120; i+=10) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 100); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(120, i); ctx.stroke();
    }

    // Draw Roads (Main Spine vs Ribs)
    dataRef.current.roads.forEach(r => {
      const isSpine = Math.abs(r.p1.y - 50) < 5 && Math.abs(r.p2.y - 50) < 5;
      ctx.strokeStyle = isSpine ? '#6366f1' : '#ff00ff';
      ctx.lineWidth = isSpine ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(r.p1.x, r.p1.y);
      ctx.lineTo(r.p2.x, r.p2.y);
      ctx.stroke();
    });

    // Draw Active Ants
    dataRef.current.ants.forEach(ant => {
      if (!ant.isAlive) return;
      const isCarrier = ant.type === 'carrier';
      
      // Glow
      ctx.shadowBlur = isCarrier ? 8 : 4;
      ctx.shadowColor = isCarrier ? '#6366f1' : '#ff00ff';
      
      ctx.fillStyle = isCarrier ? '#6366f1' : '#fff';
      ctx.beginPath();
      ctx.arc(ant.position.x, ant.position.y, isCarrier ? 2.5 : 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;

      // Scanning Pulse for Forks
      if (ant.type === 'fork') {
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 0.5;
        const pulse = (iteration % 10) / 10;
        ctx.beginPath();
        ctx.arc(ant.position.x, ant.position.y, 2 + pulse * 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 6px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('SPINE & RIBS (90°)', 5, 10);
    ctx.textAlign = 'right';
    ctx.fillText(`FORKS: ${dataRef.current.forkCount}`, 115, 10);

  }, [iteration]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded w-full">
      <div className="flex flex-col gap-2 mb-3 w-full px-2">
         <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-[6px] text-slate-500 font-bold uppercase">Fork Spacing: {spacing}px</span>
              <span className="text-[6px] text-indigo-400 font-mono italic">Primary Spine</span>
            </div>
            <input type="range" min="10" max="60" value={spacing} onChange={e => setSpacing(Number(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-magenta-600" />
         </div>
      </div>
      <canvas ref={canvasRef} width={120} height={100} className="bg-slate-900 rounded border border-slate-800" />
      <div className="mt-2 text-[6px] text-slate-500 font-mono uppercase text-center leading-tight">
        Indigo Carrier creates the Arterial Trunk. <br/>
        Magenta Forks create the Residential Ribs.
      </div>
    </div>
  );
};

export default CarrierDemo;
