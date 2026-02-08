
import React from 'react';
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { Shape2D } from './Shape2D';
import { DEFAULT_VIZ_SETTINGS } from '../state/uiStore';

const RenderingConsistencyDemo: React.FC = () => {
  const viz = DEFAULT_VIZ_SETTINGS;
  
  // Create a road and a shape sharing an edge
  const p1 = new Vector2D(20, 50);
  const p2 = new Vector2D(80, 50);
  const road = new Segment2D(p1, p2);
  
  const shape = new Shape2D([
    new Vector2D(20, 50),
    new Vector2D(80, 50),
    new Vector2D(80, 80),
    new Vector2D(20, 80)
  ]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded w-full">
      <div className="flex justify-between w-full px-2 mb-2">
        <span className="text-[7px] font-black uppercase text-cyan-400 tracking-widest">Rendering Verification</span>
        <span className="text-[7px] font-mono text-slate-500 uppercase">Outline Delegation</span>
      </div>
      
      <canvas
        ref={(canvas) => {
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              // 1. Draw Shape Interior (from drawShapes)
              // Note: No ctx.stroke() here!
              ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
              ctx.beginPath();
              shape.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
              ctx.closePath();
              ctx.fill();

              // 2. Draw Road Segment (from drawRoads)
              // This layer provides the actual visible boundary
              ctx.strokeStyle = `rgba(148, 163, 184, ${viz.roadOpacity / 255})`;
              ctx.lineWidth = viz.roadThickness;
              ctx.beginPath();
              ctx.moveTo(road.p1.x, road.p1.y);
              ctx.lineTo(road.p2.x, road.p2.y);
              ctx.stroke();

              // Labeling
              ctx.fillStyle = '#64748b';
              ctx.font = 'bold 5px Inter';
              ctx.textAlign = 'center';
              ctx.fillText('ROAD SEGMENT PROVIDES BORDER', 50, 45);
              ctx.fillText('SHAPE LAYER PROVIDES FILL ONLY', 50, 88);
              
              // Reference Scale
              ctx.strokeStyle = '#22d3ee';
              ctx.lineWidth = 0.5;
              ctx.beginPath(); ctx.moveTo(10, 10); ctx.lineTo(20, 10); ctx.stroke();
              ctx.fillStyle = '#22d3ee';
              ctx.fillText('ZERO OVERLAP', 35, 12);
            }
          }
        }}
        width={100}
        height={100}
        className="bg-slate-900 rounded border border-slate-800 w-full aspect-square max-w-[200px]"
      />
      <div className="mt-2 text-[6px] text-slate-500 uppercase font-mono text-center px-2">
        We have verified that strokes in the Shape Layer <br/>
        cause overlapping line artifacts. <br/>
        Policy: Shapes = Fill Only. Roads = Borders.
      </div>
    </div>
  );
};

export default RenderingConsistencyDemo;
