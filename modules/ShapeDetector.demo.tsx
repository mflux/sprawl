
import React, { useMemo } from 'react';
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { ShapeDetector } from './ShapeDetector';

const ShapeDetectorDemo: React.FC = () => {
  const data = useMemo(() => {
    // A house-like structure with an overhang and a separate square
    const segments: Segment2D[] = [
      // Triangle Top
      new Segment2D(new Vector2D(20, 30), new Vector2D(50, 10)),
      new Segment2D(new Vector2D(50, 10), new Vector2D(80, 30)),
      new Segment2D(new Vector2D(80, 30), new Vector2D(20, 30)),
      // Box Bottom
      new Segment2D(new Vector2D(20, 30), new Vector2D(20, 60)),
      new Segment2D(new Vector2D(20, 60), new Vector2D(80, 60)),
      new Segment2D(new Vector2D(80, 60), new Vector2D(80, 30)),
      // Overhang (Chimney/Antenna)
      new Segment2D(new Vector2D(35, 20), new Vector2D(35, 5)),
      // Separate floating triangle
      new Segment2D(new Vector2D(10, 70), new Vector2D(40, 70)),
      new Segment2D(new Vector2D(40, 70), new Vector2D(25, 85)),
      new Segment2D(new Vector2D(25, 85), new Vector2D(10, 70))
    ];

    const shapes = ShapeDetector.detectShapes(segments);
    return { segments, shapes };
  }, []);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded">
      <div className="flex gap-2 mb-2">
        <span className="text-[8px] uppercase text-slate-500 font-bold px-1 bg-slate-900 rounded border border-slate-800">
          Detected: {data.shapes.length} Shapes
        </span>
      </div>
      <canvas
        ref={(canvas) => {
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              // Draw discovered shapes first (as fills)
              data.shapes.forEach((shape, i) => {
                ctx.beginPath();
                shape.points.forEach((p, idx) => {
                  if (idx === 0) ctx.moveTo(p.x, p.y);
                  else ctx.lineTo(p.x, p.y);
                });
                ctx.closePath();
                ctx.fillStyle = `hsla(${i * 137.5}, 70%, 50%, 0.2)`;
                ctx.fill();
                ctx.strokeStyle = `hsla(${i * 137.5}, 70%, 50%, 0.8)`;
                ctx.lineWidth = 1;
                ctx.stroke();
              });

              // Draw original segments
              ctx.setLineDash([1, 1]);
              ctx.strokeStyle = '#334155';
              ctx.lineWidth = 0.5;
              data.segments.forEach(seg => {
                ctx.beginPath();
                ctx.moveTo(seg.p1.x, seg.p1.y);
                ctx.lineTo(seg.p2.x, seg.p2.y);
                ctx.stroke();
              });
              ctx.setLineDash([]);

              // Draw Vertices
              ctx.fillStyle = '#475569';
              const vertices = new Set<string>();
              data.segments.forEach(s => {
                vertices.add(`${s.p1.x},${s.p1.y}`);
                vertices.add(`${s.p2.x},${s.p2.y}`);
              });
              vertices.forEach(v => {
                const [x, y] = v.split(',').map(Number);
                ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
              });
            }
          }
        }}
        width={100}
        height={90}
        className="bg-slate-900 rounded border border-slate-800"
      />
      <span className="text-[6px] text-slate-600 mt-2 font-mono uppercase">Solid fills = Inner Cycles Found</span>
    </div>
  );
};

export default ShapeDetectorDemo;
