
import React, { useEffect, useRef, useState } from 'react';
import { Vector2D } from './Vector2D';
import { Ant } from './Ant';
import { Segment2D } from './Segment2D';
import { RoadNetwork } from './RoadNetwork';

const RingAntDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [iteration, setIteration] = useState(0);
  const dataRef = useRef<{ ants: Ant[], roads: Segment2D[] }>({ ants: [], roads: [] });

  const reset = () => {
    const center = new Vector2D(50, 50);
    const radius = 35;
    const ants: Ant[] = [];
    
    // Spawn 3 ants at different positions on the ring
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const pos = center.add(new Vector2D(Math.cos(angle) * radius, Math.sin(angle) * radius));
      ants.push(new Ant(pos, center, {
        type: 'ring',
        ringCenter: center,
        ringRadius: radius,
        ringClockwise: true,
        speed: 1.5,
        trailDistance: 12,
        wanderIntensity: 0.05
      }));
    }
    dataRef.current = { ants, roads: [] };
  };

  useEffect(() => {
    reset();
    const timer = setInterval(() => {
      const { ants, roads } = dataRef.current;
      ants.forEach(ant => {
        if (ant.isAlive) {
          const result = ant.update();
          if (result === 'trail_left') {
             RoadNetwork.addSegmentSnapped(ant.lastTrailPos, ant.position, roads, 4);
             ant.commitTrail();
          }
          if (ant.life < 1) ant.kill();
        }
      });
      setIteration(v => v + 1);
      if (ants.every(a => !a.isAlive)) {
        setTimeout(reset, 1000);
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
    
    // Draw orbit path (faint)
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
    ctx.beginPath(); ctx.arc(50, 50, 35, 0, Math.PI * 2); ctx.stroke();

    // Draw Roads
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 1.5;
    dataRef.current.roads.forEach(r => {
      ctx.beginPath();
      ctx.moveTo(r.p1.x, r.p1.y);
      ctx.lineTo(r.p2.x, r.p2.y);
      ctx.stroke();
    });

    // Draw Ants
    dataRef.current.ants.forEach(ant => {
      if (!ant.isAlive) return;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ant.position.x, ant.position.y, 2, 0, Math.PI * 2); ctx.fill();
      
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(ant.position.x, ant.position.y);
      ctx.lineTo(ant.position.x + ant.direction.x * 5, ant.position.y + ant.direction.y * 5);
      ctx.stroke();
    });

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 6px Inter';
    ctx.fillText('STABLE ORBIT TEST', 5, 10);
    ctx.fillText(`ROADS: ${dataRef.current.roads.length}`, 5, 90);

  }, [iteration]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded">
      <canvas ref={canvasRef} width={100} height={100} className="bg-slate-900 rounded border border-slate-800" />
    </div>
  );
};

export default RingAntDemo;
