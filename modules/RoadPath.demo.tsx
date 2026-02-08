
import React, { useMemo } from 'react';
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { RoadPath } from './RoadPath';

const RoadPathDemo: React.FC = () => {
  const data = useMemo(() => {
    const segments = [
      // Long stretch
      new Segment2D(new Vector2D(10, 20), new Vector2D(30, 20)),
      new Segment2D(new Vector2D(30, 20), new Vector2D(50, 30)),
      new Segment2D(new Vector2D(50, 30), new Vector2D(80, 20)),
      
      // A fork
      new Segment2D(new Vector2D(50, 30), new Vector2D(50, 50)),
      
      // Another stretch
      new Segment2D(new Vector2D(50, 50), new Vector2D(80, 70)),
      new Segment2D(new Vector2D(80, 70), new Vector2D(20, 90)),
      
      // Dead end fork
      new Segment2D(new Vector2D(80, 70), new Vector2D(95, 70))
    ];

    const stretches = RoadPath.detectStretches(segments);
    return { segments, stretches };
  }, []);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded w-full">
      <div className="flex justify-between w-full px-2 mb-2">
        <span className="text-[7px] font-black uppercase text-cyan-400 tracking-widest">Road Corridors</span>
        <span className="text-[7px] font-mono text-slate-500 uppercase">{data.stretches.length} Stretches Detected</span>
      </div>
      <canvas
        ref={(canvas) => {
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              // Draw raw segments faintly
              ctx.strokeStyle = '#1e293b';
              ctx.lineWidth = 0.5;
              data.segments.forEach(s => {
                ctx.beginPath();
                ctx.moveTo(s.p1.x, s.p1.y);
                ctx.lineTo(s.p2.x, s.p2.y);
                ctx.stroke();
              });

              // Draw discovered stretches
              data.stretches.forEach((path, i) => {
                const color = `hsla(${(i * 137.5) % 360}, 70%, 50%, 1)`;
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                ctx.beginPath();
                path.points.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                ctx.stroke();

                // Draw midpoint for spawn target visualization
                const mid = path.midpoint();
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(mid.x, mid.y, 2, 0, Math.PI * 2); ctx.fill();
                
                // Draw nodes
                ctx.fillStyle = color;
                path.points.forEach(p => {
                  ctx.beginPath(); ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2); ctx.fill();
                });
              });
            }
          }
        }}
        width={100}
        height={100}
        className="bg-slate-900 rounded border border-slate-800 w-full aspect-square max-w-[200px]"
      />
      <div className="mt-2 text-[6px] text-slate-500 uppercase font-mono text-center px-2">
        Each colored path represents a sequence of segments <br/> with no interior forks.
      </div>
    </div>
  );
};

export default RoadPathDemo;
