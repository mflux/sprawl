
import React, { useEffect, useRef, useState } from 'react';
import { Vector2D } from './Vector2D';
import { RoadNetwork } from './RoadNetwork';
import { Segment2D } from './Segment2D';

const RoadNetworkDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [iteration, setIteration] = useState(0);
  const segmentsRef = useRef<Segment2D[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const segs = segmentsRef.current;
      if (segs.length > 20) {
        segmentsRef.current = [];
      } else {
        const last = segs.length > 0 
          ? segs[segs.length - 1].p2 
          : new Vector2D(50, 40);
        
        // Target a slightly jittered forward position
        const angle = Math.sin(iteration * 0.4) * 0.5;
        const next = last.add(new Vector2D(Math.cos(angle) * 15, Math.sin(angle) * 15));
        
        // Apply snapping via RoadNetwork utility
        RoadNetwork.addSegmentSnapped(last, next, segs, 10);
      }
      setIteration(i => i + 1);
    }, 300);
    return () => clearInterval(interval);
  }, [iteration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Roads
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    segmentsRef.current.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s.p1.x, s.p1.y);
      ctx.lineTo(s.p2.x, s.p2.y);
      ctx.stroke();
      
      // Nodes
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.arc(s.p1.x, s.p1.y, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s.p2.x, s.p2.y, 1.5, 0, Math.PI * 2); ctx.fill();
    });

    ctx.fillStyle = '#64748b';
    ctx.font = '6px Inter';
    ctx.fillText('Automatic snapping to near vertices', 5, 10);

  }, [iteration]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded">
      <canvas
        ref={canvasRef}
        width={100}
        height={80}
        className="bg-slate-900 rounded border border-slate-800"
      />
    </div>
  );
};

export default RoadNetworkDemo;
