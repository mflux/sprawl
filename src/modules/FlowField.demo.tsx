import React, { useEffect, useRef, useState } from 'react';
import { Vector2D } from './Vector2D';
import { FlowField } from './FlowField';

const FlowFieldDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [iteration, setIteration] = useState(0);
  const fieldRef = useRef<FlowField | null>(null);
  const particlesRef = useRef<{ pos: Vector2D, life: number }[]>([]);

  // Demo size constants
  const W = 120;
  const H = 100;
  const ORIGIN_X = -60;
  const ORIGIN_Y = -50;

  useEffect(() => {
    // Create a field centered on the canvas view
    fieldRef.current = new FlowField(W, H, 8, ORIGIN_X, ORIGIN_Y);
    
    // Initialize particles across the full world range [-60, 60] x [-50, 50]
    particlesRef.current = Array.from({ length: 15 }, () => ({
      pos: new Vector2D(ORIGIN_X + Math.random() * W, ORIGIN_Y + Math.random() * H),
      life: Math.random() * 100
    }));

    const timer = setInterval(() => {
      if (fieldRef.current) {
        fieldRef.current.generate(iteration * 0.005);
        
        // Update particles
        particlesRef.current.forEach(p => {
          const force = fieldRef.current!.getVectorAt(p.pos.x, p.pos.y);
          p.pos = p.pos.add(force.mul(1.5));
          p.life--;

          // Reset if out of bounds or dead
          if (p.life <= 0 || p.pos.x < ORIGIN_X || p.pos.x > ORIGIN_X + W || p.pos.y < ORIGIN_Y || p.pos.y > ORIGIN_Y + H) {
            p.pos = new Vector2D(ORIGIN_X + Math.random() * W, ORIGIN_Y + Math.random() * H);
            p.life = 50 + Math.random() * 50;
          }
        });
      }
      setIteration(v => v + 1);
    }, 40);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fieldRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fix: replaced p.push() with ctx.save() as this demo uses Canvas 2D API
    ctx.save();
    // Center the demo view visually in the 120x100 canvas
    ctx.translate(60, 50);

    const field = fieldRef.current;
    const res = field.resolution;

    // Draw Vector Grid
    for (let x = 0; x < field.cols; x++) {
      for (let y = 0; y < field.rows; y++) {
        const worldX = ORIGIN_X + x * res;
        const worldY = ORIGIN_Y + y * res;
        const v = field.getVectorAt(worldX, worldY);
        
        if (v.mag() === 0) continue;

        const angle = Math.atan2(v.y, v.x);
        const hue = (angle * 180 / Math.PI + 180) % 360;

        ctx.strokeStyle = `hsla(${hue}, 60%, 50%, 0.3)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(worldX, worldY);
        ctx.lineTo(worldX + v.x * 5, worldY + v.y * 5);
        ctx.stroke();
      }
    }

    // Draw Flowing Particles
    ctx.fillStyle = '#fbbf24';
    particlesRef.current.forEach(p => {
      const alpha = Math.min(1, p.life / 20);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    
    // Fix: replaced p.pop() with ctx.restore() as this demo uses Canvas 2D API
    ctx.restore();

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 6px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('NOISE FIELD STEERING (CENTERED)', 5, 10);

  }, [iteration]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded">
      <canvas
        ref={canvasRef}
        width={120}
        height={100}
        className="bg-slate-900 rounded border border-slate-800"
      />
    </div>
  );
};

export default FlowFieldDemo;