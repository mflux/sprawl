
import React from 'react';
import { Vector2D } from './Vector2D';
import { isBoxInView, getPathBounds, ViewBounds } from './Culling';

const CullingDemo: React.FC = () => {
  const viewport: ViewBounds = { minX: 25, minY: 25, maxX: 75, maxY: 75 };

  const scenarios = [
    {
      title: 'Contained',
      render: (ctx: CanvasRenderingContext2D) => {
        const points = [new Vector2D(35, 35), new Vector2D(65, 35), new Vector2D(65, 65), new Vector2D(35, 65)];
        drawScenario(ctx, points, viewport);
      }
    },
    {
      title: 'Partial Overlap',
      render: (ctx: CanvasRenderingContext2D) => {
        const points = [new Vector2D(10, 10), new Vector2D(40, 10), new Vector2D(40, 40), new Vector2D(10, 40)];
        drawScenario(ctx, points, viewport);
      }
    },
    {
      title: 'Bridge Path',
      render: (ctx: CanvasRenderingContext2D) => {
        // Path that starts and ends outside but crosses through the middle
        const points = [new Vector2D(5, 50), new Vector2D(50, 50), new Vector2D(95, 50)];
        drawScenario(ctx, points, viewport, true);
      }
    },
    {
      title: 'Z-Path Crossing',
      render: (ctx: CanvasRenderingContext2D) => {
        // Z-shape where endpoints are both on the left, but middle is inside
        const points = [new Vector2D(10, 30), new Vector2D(90, 50), new Vector2D(10, 70)];
        drawScenario(ctx, points, viewport, true);
      }
    },
    {
      title: 'Culled (Outside)',
      render: (ctx: CanvasRenderingContext2D) => {
        const points = [new Vector2D(80, 10), new Vector2D(95, 10), new Vector2D(95, 20), new Vector2D(80, 20)];
        drawScenario(ctx, points, viewport);
      }
    },
    {
      title: 'Large Culled',
      render: (ctx: CanvasRenderingContext2D) => {
        const points = [new Vector2D(-50, -50), new Vector2D(-10, -50), new Vector2D(-10, -10), new Vector2D(-50, -10)];
        drawScenario(ctx, points, viewport);
      }
    }
  ];

  function drawScenario(ctx: CanvasRenderingContext2D, points: Vector2D[], view: ViewBounds, isPath: boolean = false) {
    const bounds = getPathBounds(points);
    const inView = isBoxInView(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, view);

    // 1. Draw Viewport
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.strokeRect(view.minX, view.minY, view.maxX - view.minX, view.maxY - view.minY);
    ctx.setLineDash([]);

    // 2. Draw AABB of the object (faint)
    ctx.strokeStyle = inView ? 'rgba(34, 211, 238, 0.1)' : 'rgba(244, 63, 94, 0.1)';
    ctx.strokeRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);

    // 3. Draw the object
    ctx.strokeStyle = inView ? '#22d3ee' : '#f43f5e';
    ctx.fillStyle = inView ? 'rgba(34, 211, 238, 0.2)' : 'rgba(244, 63, 94, 0.2)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    if (!isPath) ctx.closePath();
    ctx.stroke();
    if (!isPath) ctx.fill();

    // 4. Status label
    ctx.fillStyle = inView ? '#22d3ee' : '#f43f5e';
    ctx.font = 'bold 7px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(inView ? 'IN VIEW' : 'CULLED', 50, 92);
  }

  return (
    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2 rounded">
      {scenarios.map((ex, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className="text-[7px] uppercase text-slate-500 font-bold mb-1">{ex.title}</span>
          <canvas
            ref={(canvas) => {
              if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ex.render(ctx);
                }
              }
            }}
            width={100}
            height={100}
            className="bg-slate-900 rounded border border-slate-800"
          />
        </div>
      ))}
    </div>
  );
};

export default CullingDemo;
