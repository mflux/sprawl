
import React from 'react';
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';

const ShapeDemo: React.FC = () => {
  const scenarios = [
    { title: 'Solid (CW)', setup: () => [
      new Shape2D([new Vector2D(20, 20), new Vector2D(60, 20), new Vector2D(60, 60), new Vector2D(20, 60)])
    ]},
    { title: 'Hole (CCW)', setup: () => [
      new Shape2D([new Vector2D(20, 20), new Vector2D(20, 60), new Vector2D(60, 60), new Vector2D(60, 20)])
    ]},
    { title: 'Concave', setup: () => [
      new Shape2D([
        new Vector2D(10, 10), new Vector2D(70, 10), new Vector2D(70, 70), 
        new Vector2D(40, 40), new Vector2D(10, 70)
      ])
    ]},
    { title: 'Intersection', setup: () => [
      new Shape2D([new Vector2D(10, 10), new Vector2D(50, 10), new Vector2D(50, 50), new Vector2D(10, 50)]),
      new Shape2D([new Vector2D(30, 30), new Vector2D(70, 30), new Vector2D(70, 70), new Vector2D(30, 70)])
    ]},
    { title: 'Nested', setup: () => [
      new Shape2D([new Vector2D(5, 5), new Vector2D(75, 5), new Vector2D(75, 75), new Vector2D(5, 75)]),
      new Shape2D([new Vector2D(25, 25), new Vector2D(55, 25), new Vector2D(55, 55), new Vector2D(25, 55)])
    ]},
    { title: 'Complex', setup: () => [
      new Shape2D([
        new Vector2D(40, 5), new Vector2D(75, 40), new Vector2D(40, 75), 
        new Vector2D(5, 40), new Vector2D(40, 30)
      ])
    ]}
  ];

  function drawScene(ctx: CanvasRenderingContext2D, shapes: Shape2D[]) {
    // Find intersections between all shapes
    const intersections: Vector2D[] = [];
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const hits = shapes[i].intersectsShape(shapes[j]);
        hits.forEach(h => {
          if (!intersections.some(p => p.equals(h))) intersections.push(h);
        });
      }
    }

    shapes.forEach(shape => {
      const isHole = shape.isHole();
      
      // Fill
      ctx.fillStyle = isHole ? 'rgba(244, 63, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)';
      ctx.beginPath();
      shape.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fill();

      // Outline
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isHole ? '#f43f5e' : '#3b82f6';
      ctx.setLineDash(isHole ? [2, 2] : []);
      ctx.stroke();
      ctx.setLineDash([]);

      // Vertices
      ctx.fillStyle = '#10b981';
      shape.points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Intersections
    ctx.fillStyle = '#fbbf24';
    intersections.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  return (
    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2 rounded">
      {scenarios.map((ex, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="flex items-center gap-1 mb-1">
             <span className="text-[8px] uppercase text-slate-500 font-bold">{ex.title}</span>
          </div>
          <canvas
            ref={(canvas) => {
              if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  drawScene(ctx, ex.setup());
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

export default ShapeDemo;
