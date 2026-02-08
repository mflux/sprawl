
import React, { useEffect, useRef, useState } from 'react';
import { Vector2D } from './Vector2D';
import { Ant } from './Ant';

const AntDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [iteration, setIteration] = useState(0);
  
  const antsRef = useRef<Ant[]>([]);
  const trailsRef = useRef<Vector2D[][]>([]); // To show the paths
  const collisionPointRef = useRef<Vector2D | null>(null);

  const resetDemo = () => {
    // 1. Steering Demo Ant: Random start direction, forced turn speed
    const steeringAnt = new Ant(new Vector2D(15, 25), new Vector2D(85, 25), { 
      speed: 1.2, 
      turnSpeed: 0.04, 
      randomInitialDir: true,
      id: 'steer' 
    });

    // 2. Collision Pair
    const c1 = new Ant(new Vector2D(15, 65), new Vector2D(85, 65), { speed: 1.0, id: 'c1' });
    const c2 = new Ant(new Vector2D(85, 65), new Vector2D(15, 65), { speed: 1.0, id: 'c2' });

    antsRef.current = [steeringAnt, c1, c2];
    trailsRef.current = antsRef.current.map(() => []);
    collisionPointRef.current = null;
  };

  useEffect(() => {
    resetDemo();
    const timer = setInterval(() => {
      let allDead = true;
      const ants = antsRef.current;
      const trails = trailsRef.current;
      
      for (let i = 0; i < ants.length; i++) {
        if (ants[i].isAlive) {
          ants[i].update();
          trails[i].push(ants[i].position.copy());
          if (trails[i].length > 100) trails[i].shift();
          allDead = false;
        }
      }

      // Check collision for c1 and c2
      const c1 = ants.find(a => a.id === 'c1');
      const c2 = ants.find(a => a.id === 'c2');
      if (c1?.isAlive && c2?.isAlive && Ant.checkCollision(c1, c2, 6)) {
        collisionPointRef.current = c1.position.add(c2.position).div(2);
        c1.kill();
        c2.kill();
      }

      setIteration(v => v + 1);
      if (allDead) {
        setTimeout(resetDemo, 1200);
      }
    }, 33);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background separation
    ctx.strokeStyle = '#1e293b';
    ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(0, 45); ctx.lineTo(100, 45); ctx.stroke();
    ctx.setLineDash([]);

    // Draw Trails
    trailsRef.current.forEach((trail, i) => {
      if (trail.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = i === 0 ? 'rgba(34, 211, 238, 0.3)' : 'rgba(251, 191, 36, 0.2)';
      ctx.lineWidth = 1;
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let j = 1; j < trail.length; j++) {
        ctx.lineTo(trail[j].x, trail[j].y);
      }
      ctx.stroke();
    });

    // Draw Targets
    ctx.fillStyle = '#1e293b';
    antsRef.current.forEach(ant => {
       ctx.beginPath(); ctx.arc(ant.targetPos.x, ant.targetPos.y, 2, 0, Math.PI * 2); ctx.fill();
    });

    antsRef.current.forEach(ant => {
      if (!ant.isAlive) return;

      // Draw Ant body
      ctx.fillStyle = ant.id === 'steer' ? '#22d3ee' : ant.color;
      ctx.beginPath(); ctx.arc(ant.position.x, ant.position.y, 2, 0, Math.PI * 2); ctx.fill();
      
      // Direction line
      ctx.strokeStyle = ant.id === 'steer' ? '#22d3ee' : ant.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ant.position.x, ant.position.y);
      ctx.lineTo(
        ant.position.x + ant.direction.x * 4,
        ant.position.y + ant.direction.y * 4
      );
      ctx.stroke();
    });

    // Collision effect
    if (collisionPointRef.current) {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(collisionPointRef.current.x, collisionPointRef.current.y, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 7px Inter';
      ctx.fillText('CRASH', collisionPointRef.current.x - 12, collisionPointRef.current.y - 8);
    }

    ctx.fillStyle = '#64748b';
    ctx.font = '6px Inter';
    ctx.fillText('Smooth Steering Curve', 5, 12);
    ctx.fillText('Collision Physics', 5, 54);

  }, [iteration]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded">
      <canvas
        ref={canvasRef}
        width={100}
        height={90}
        className="bg-slate-900 rounded border border-slate-800"
      />
    </div>
  );
};

export default AntDemo;
