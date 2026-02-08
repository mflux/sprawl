
import React from 'react';
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { Subdivider } from './Subdivider';

const SubdividerDemo: React.FC = () => {
  const shapes = [
    // Standard block
    new Shape2D([new Vector2D(10, 10), new Vector2D(90, 10), new Vector2D(90, 70), new Vector2D(10, 70)]),
    // Triangular block
    new Shape2D([new Vector2D(50, 5), new Vector2D(95, 80), new Vector2D(5, 80)]),
    // Concave block to demonstrate filtering logic
    new Shape2D([
      new Vector2D(10, 10), 
      new Vector2D(90, 10), 
      new Vector2D(90, 40), 
      new Vector2D(50, 25), // Indentation that forces some shared normals to point outward
      new Vector2D(10, 40)
    ])
  ];

  return (
    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2 rounded">
      {shapes.map((shape, i) => (
        <div key={i} className="flex flex-col items-center">
          <canvas
            ref={(canvas) => {
              if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  
                  // Draw shape boundary
                  ctx.strokeStyle = '#3b82f6';
                  ctx.lineWidth = 1;
                  ctx.beginPath();
                  shape.points.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                  ctx.closePath();
                  ctx.stroke();

                  // Use real Subdivider logic to get the ants
                  // Fix: Added missing trailDistance and wanderIntensity arguments
                  const ants = Subdivider.spawnSubdividers(shape, 5, 0.005);
                  
                  // Draw the shared guide vector if available
                  if (shape.guideVector) {
                    ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
                    ctx.setLineDash([2, 2]);
                    const center = shape.points.reduce((acc, p) => acc.add(p), new Vector2D(0,0)).div(shape.points.length);
                    ctx.beginPath();
                    ctx.moveTo(center.x, center.y);
                    ctx.lineTo(center.x + shape.guideVector.x * 20, center.y + shape.guideVector.y * 20);
                    ctx.stroke();
                    ctx.setLineDash([]);
                  }

                  // Draw successful ants' starting trajectories
                  ctx.strokeStyle = '#f59e0b';
                  ctx.lineWidth = 1.5;
                  ants.forEach(ant => {
                    ctx.beginPath();
                    ctx.moveTo(ant.position.x, ant.position.y);
                    ctx.lineTo(ant.position.x + ant.direction.x * 12, ant.position.y + ant.direction.y * 12);
                    ctx.stroke();

                    // Mark start vertex
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath();
                    ctx.arc(ant.position.x, ant.position.y, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                  });

                  // Indicate filtered (killed) vertices in red for demo clarity
                  ctx.fillStyle = 'rgba(244, 63, 94, 0.5)';
                  shape.points.forEach(p => {
                    // If this vertex belongs to the main arterial but didn't spawn an ant
                    // (Note: This is a simplified demo check)
                    if (!ants.some(a => a.position.equals(p))) {
                      ctx.beginPath();
                      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                      ctx.fill();
                    }
                  });
                }
              }
            }}
            width={100}
            height={90}
            className="bg-slate-900 rounded border border-slate-800"
          />
        </div>
      ))}
    </div>
  );
};

export default SubdividerDemo;
