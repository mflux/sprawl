
import React from 'react';
import { Vector2D } from './Vector2D';
import { Path2D } from './Path2D';
import { Segment2D } from './Segment2D';

const PathDemo: React.FC = () => {
  const scenarios = [
    { title: 'Open Path', setup: () => {
      const p = new Path2D([new Vector2D(10,10), new Vector2D(70,10), new Vector2D(70,70)], false);
      return { paths: [p], segments: [] };
    }},
    { title: 'Closed Path', setup: () => {
      const p = new Path2D([new Vector2D(10,10), new Vector2D(70,10), new Vector2D(70,70)], true);
      return { paths: [p], segments: [] };
    }},
    { title: 'Path-Seg Hit', setup: () => {
      const p = new Path2D([new Vector2D(10,40), new Vector2D(70,40)], false);
      const s = new Segment2D(new Vector2D(40,10), new Vector2D(40,70));
      return { paths: [p], segments: [s] };
    }},
    { title: 'Complex Loop', setup: () => {
      const p = new Path2D([
        new Vector2D(40,10), new Vector2D(70,40), 
        new Vector2D(40,70), new Vector2D(10,40)
      ], true);
      return { paths: [p], segments: [] };
    }},
    { title: 'Path-Path', setup: () => {
      const p1 = new Path2D([new Vector2D(10,10), new Vector2D(70,70)], false);
      const p2 = new Path2D([new Vector2D(10,70), new Vector2D(70,10)], false);
      return { paths: [p1, p2], segments: [] };
    }},
    { title: 'Multi-Hit', setup: () => {
      const p = new Path2D([new Vector2D(10,20), new Vector2D(70,20), new Vector2D(70,60), new Vector2D(10,60)], true);
      const s = new Segment2D(new Vector2D(40,0), new Vector2D(40,80));
      return { paths: [p], segments: [s] };
    }}
  ];

  function drawScene(ctx: CanvasRenderingContext2D, paths: Path2D[], segments: Segment2D[]) {
    // Collect all segments and calculate all intersections
    const allSegments: Segment2D[] = [
      ...segments,
      ...paths.flatMap(p => p.toSegments())
    ];

    const intersections: Vector2D[] = [];
    for (let i = 0; i < allSegments.length; i++) {
      for (let j = i + 1; j < allSegments.length; j++) {
        const hit = allSegments[i].intersect(allSegments[j]);
        if (hit && !intersections.some(p => p.equals(hit))) {
          intersections.push(hit);
        }
      }
    }

    // Draw segments
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3b82f6';
    allSegments.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s.p1.x, s.p1.y);
      ctx.lineTo(s.p2.x, s.p2.y);
      ctx.stroke();
    });

    // Draw intersection points
    ctx.fillStyle = '#f43f5e';
    intersections.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw vertices
    ctx.fillStyle = '#10b981';
    paths.flatMap(p => p.points).forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  return (
    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2 rounded">
      {scenarios.map((ex, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className="text-[8px] uppercase text-slate-500 font-bold mb-1">{ex.title}</span>
          <canvas
            ref={(canvas) => {
              if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  const { paths, segments } = ex.setup();
                  drawScene(ctx, paths, segments);
                }
              }
            }}
            width={80}
            height={80}
            className="bg-slate-900 rounded border border-slate-800"
          />
        </div>
      ))}
    </div>
  );
};

export default PathDemo;
