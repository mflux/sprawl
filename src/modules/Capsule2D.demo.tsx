import React, { useState, useRef, useEffect } from 'react';
import { Vector2D } from './Vector2D';
import { Capsule2D } from './Capsule2D';

const CapsuleDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState<Vector2D>(new Vector2D(70, 50));
  const [iteration, setIteration] = useState(0);

  // Fixed Capsule
  const staticCapsule = new Capsule2D(new Vector2D(30, 30), new Vector2D(30, 70), 8);

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

    // Mouse Capsule (Dynamic)
    const dynamicCapsule = new Capsule2D(
      mousePos.add(new Vector2D(-10, -5)), 
      mousePos.add(new Vector2D(10, 5)), 
      6
    );

    const isColliding = staticCapsule.intersects(dynamicCapsule);

    const drawCapsule = (cap: Capsule2D, color: string, fill: string) => {
      ctx.beginPath();
      ctx.lineWidth = cap.radius * 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = fill;
      ctx.moveTo(cap.p1.x, cap.p1.y);
      ctx.lineTo(cap.p2.x, cap.p2.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = color;
      // Drawing the outer shell with lineCap round is easy, 
      // but let's draw the actual segment line for clarity
      ctx.setLineDash([2, 2]);
      ctx.moveTo(cap.p1.x, cap.p1.y);
      ctx.lineTo(cap.p2.x, cap.p2.y);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // Draw static
    drawCapsule(staticCapsule, '#475569', 'rgba(71, 85, 105, 0.2)');

    // Draw dynamic
    const dynamicColor = isColliding ? '#f43f5e' : '#22d3ee';
    const dynamicFill = isColliding ? 'rgba(244, 63, 94, 0.3)' : 'rgba(34, 211, 238, 0.3)';
    drawCapsule(dynamicCapsule, dynamicColor, dynamicFill);

    // Visual feedback
    ctx.fillStyle = isColliding ? '#f43f5e' : '#64748b';
    ctx.font = 'bold 6px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(isColliding ? 'COLLISION' : 'SEARCHING...', 50, 95);

  }, [mousePos]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded w-full">
      <span className="text-[7px] font-black uppercase text-slate-500 mb-2 tracking-widest text-center">Capsule-to-Capsule SAT</span>
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

export default CapsuleDemo;
