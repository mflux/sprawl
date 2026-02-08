
import React, { useMemo } from 'react';
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { ArterialDetector } from './ArterialDetector';

const ArterialDetectorDemo: React.FC = () => {
  const data = useMemo(() => {
    // A complex "river-front" block
    const points: Vector2D[] = [];
    
    // 1. Organic winding "river" edge (top)
    // 15 points with small random variations in angle (approx 5-10 deg each)
    for (let i = 0; i <= 15; i++) {
      const x = 10 + i * 5.3;
      const y = 20 + Math.sin(i * 0.5) * 8;
      points.push(new Vector2D(x, y));
    }

    // 2. Sharp "industrial" corners (bottom)
    points.push(new Vector2D(90, 40)); // Sharp turn 1
    points.push(new Vector2D(90, 80)); // Sharp turn 2
    points.push(new Vector2D(10, 80)); // Sharp turn 3
    points.push(new Vector2D(10, 40)); // Sharp turn 4

    const organicShape = new Shape2D(points);
    const arterials = ArterialDetector.detectArterialsFromShapes([organicShape], 40);
    
    return { shape: organicShape, arterials };
  }, []);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded w-full">
      <div className="flex items-center justify-between w-full mb-2 px-1">
        <span className="text-[7px] font-black uppercase text-cyan-500 tracking-widest">
          Arterial Discovery
        </span>
        <span className="text-[7px] font-mono text-slate-500">
          Threshold: 40°
        </span>
      </div>
      
      <canvas
        ref={(canvas) => {
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              // Draw raw shape outline faintly
              ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
              ctx.setLineDash([1, 2]);
              ctx.lineWidth = 1;
              ctx.beginPath();
              data.shape.points.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
              ctx.closePath();
              ctx.stroke();
              ctx.setLineDash([]);

              // Draw discovered arterials
              data.arterials.forEach((art, i) => {
                const color = `hsla(${(i * 137.5) % 360}, 80%, 60%, 1)`;
                
                // Shadow/Glow
                ctx.shadowBlur = 4;
                ctx.shadowColor = color;
                
                ctx.beginPath();
                art.points.forEach((p, idx) => {
                  if (idx === 0) ctx.moveTo(p.x, p.y);
                  else ctx.lineTo(p.x, p.y);
                });
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.stroke();
                
                ctx.shadowBlur = 0;

                // Mark vertices within arterial
                ctx.fillStyle = color;
                art.points.forEach(p => {
                  ctx.beginPath(); ctx.arc(p.x, p.y, 0.8, 0, Math.PI * 2); ctx.fill();
                });
              });

              // Label segments
              ctx.fillStyle = '#64748b';
              ctx.font = 'bold 5px Inter';
              ctx.textAlign = 'center';
              ctx.fillText("WINDING RIVER EDGE (1 ARTERIAL)", 50, 12);
              ctx.fillText("SHARP GRID CORNERS (SPLIT)", 50, 88);
            }
          }
        }}
        width={100}
        height={100}
        className="bg-slate-900 rounded border border-slate-800 aspect-square"
      />
      <p className="text-[6px] text-slate-500 mt-2 px-2 text-center uppercase leading-tight font-medium">
        Smoothly connected points (top) are grouped into single axes. <br/>
        Sudden changes in direction (bottom) define new arterial runs.
      </p>
    </div>
  );
};

export default ArterialDetectorDemo;
