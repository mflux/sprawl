
import React from 'react';
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';

const SegmentDemo: React.FC = () => {
  const scenarios = [
    { title: 'X-Sect', setup: () => [
        new Segment2D(new Vector2D(10, 10), new Vector2D(70, 70)),
        new Segment2D(new Vector2D(10, 70), new Vector2D(70, 10))
    ]},
    { title: 'T-Junct', setup: () => [
        new Segment2D(new Vector2D(10, 40), new Vector2D(70, 40)),
        new Segment2D(new Vector2D(40, 40), new Vector2D(40, 10))
    ]},
    { title: 'Overlap', setup: () => [
        new Segment2D(new Vector2D(10, 40), new Vector2D(50, 40)),
        new Segment2D(new Vector2D(30, 40), new Vector2D(70, 40))
    ]},
    { title: 'Parallel', setup: () => [
        new Segment2D(new Vector2D(10, 20), new Vector2D(70, 20)),
        new Segment2D(new Vector2D(10, 50), new Vector2D(70, 50))
    ]},
    { title: 'Disjoint', setup: () => [
        new Segment2D(new Vector2D(5, 5), new Vector2D(30, 30)),
        new Segment2D(new Vector2D(45, 45), new Vector2D(75, 75))
    ]},
    { title: 'Same', setup: () => [
        new Segment2D(new Vector2D(10, 40), new Vector2D(70, 40)),
        new Segment2D(new Vector2D(10, 40), new Vector2D(70, 40))
    ]}
  ];

  function drawScenario(ctx: CanvasRenderingContext2D, s1: Segment2D, s2: Segment2D) {
    const intersect = s1.intersect(s2);
    const shared = s1.sharesVertex(s2);
    const overlaps = s1.overlaps(s2);
    ctx.lineWidth = 2;
    let c1 = '#3b82f6', c2 = '#10b981';
    if (overlaps) { c1 = c2 = '#06b6d4'; }
    else if (intersect) { c1 = c2 = '#f43f5e'; }
    else if (shared) { c1 = c2 = '#8b5cf6'; }

    ctx.strokeStyle = c1;
    ctx.beginPath(); ctx.moveTo(s1.p1.x, s1.p1.y + (overlaps ? -1 : 0)); ctx.lineTo(s1.p2.x, s1.p2.y + (overlaps ? -1 : 0)); ctx.stroke();
    ctx.strokeStyle = c2;
    ctx.beginPath(); ctx.moveTo(s2.p1.x, s2.p1.y + (overlaps ? 1 : 0)); ctx.lineTo(s2.p2.x, s2.p2.y + (overlaps ? 1 : 0)); ctx.stroke();

    if (intersect) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(intersect.x, intersect.y, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (shared) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.arc(shared.x, shared.y, 4, 0, Math.PI * 2); ctx.stroke();
    }
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
                  const [s1, s2] = ex.setup();
                  drawScenario(ctx, s1, s2);
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

export default SegmentDemo;
