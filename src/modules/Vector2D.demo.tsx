
import React from 'react';
import { Vector2D } from './Vector2D';

const VectorDemo: React.FC = () => {
  const examples = [
    { title: 'Add', render: (ctx: CanvasRenderingContext2D) => {
        const vA = new Vector2D(30, 30);
        const vB = new Vector2D(40, 10);
        const vSum = vA.add(vB);
        drawArrow(ctx, 5, 65, 5 + vA.x, 65 - vA.y, '#3b82f6', 'A');
        drawArrow(ctx, 5 + vA.x, 65 - vA.y, 5 + vSum.x, 65 - vSum.y, '#10b981', 'B');
        drawArrow(ctx, 5, 65, 5 + vSum.x, 65 - vSum.y, '#f59e0b', 'Sum');
    }},
    { title: 'Sub', render: (ctx: CanvasRenderingContext2D) => {
        const vA = new Vector2D(50, 40);
        const vB = new Vector2D(30, 20);
        const vDiff = vA.sub(vB);
        drawArrow(ctx, 5, 65, 5 + vA.x, 65 - vA.y, '#3b82f6', 'A');
        drawArrow(ctx, 5, 65, 5 + vDiff.x, 65 - vDiff.y, '#f59e0b', 'Diff');
    }},
    { title: 'Norm', render: (ctx: CanvasRenderingContext2D) => {
        const v = new Vector2D(40, 20);
        const vn = v.normalize().mul(30);
        ctx.strokeStyle = '#334155';
        ctx.beginPath(); ctx.arc(40, 40, 30, 0, Math.PI * 2); ctx.stroke();
        drawArrow(ctx, 40, 40, 40 + v.x, 40 - v.y, '#3b82f6', '');
        drawArrow(ctx, 40, 40, 40 + vn.x, 40 - vn.y, '#f59e0b', '');
    }},
    { title: 'Scale', render: (ctx: CanvasRenderingContext2D) => {
        const v = new Vector2D(20, 15);
        const vs = v.mul(2.5);
        drawArrow(ctx, 5, 65, 5 + vs.x, 65 - vs.y, '#f59e0b', '2.5V');
        drawArrow(ctx, 5, 65, 5 + v.x, 65 - v.y, '#3b82f6', 'V');
    }}
  ];

  function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, label: string) {
    const headLength = 5;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
    ctx.fill();
    if(label) {
      ctx.font = '8px Inter';
      ctx.fillText(label, (x1 + x2) / 2 + 3, (y1 + y2) / 2);
    }
  }

  return (
    <div className="grid grid-cols-4 gap-2 bg-slate-950 p-2 rounded">
      {examples.map((ex, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className="text-[8px] uppercase text-slate-500 font-bold mb-1">{ex.title}</span>
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
            width={80}
            height={70}
            className="bg-slate-900 rounded border border-slate-800"
          />
        </div>
      ))}
    </div>
  );
};

export default VectorDemo;
