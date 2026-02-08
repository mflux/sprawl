
import React from 'react';
import { Vector2D } from './Vector2D';
import { Hub } from './Hub';

const HubDemo: React.FC = () => {
  const hubs = [
    new Hub(new Vector2D(20, 40), 10),
    new Hub(new Vector2D(40, 40), 20),
    new Hub(new Vector2D(70, 40), 5)
  ];

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded">
      <span className="text-[8px] uppercase text-slate-500 font-bold mb-2">Hub Size Variation</span>
      <canvas
        ref={(canvas) => {
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              hubs.forEach(h => {
                ctx.beginPath();
                ctx.arc(h.position.x, h.position.y, h.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(34, 211, 238, 0.2)';
                ctx.fill();
                ctx.strokeStyle = '#22d3ee';
                ctx.stroke();
                
                // Center point
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(h.position.x, h.position.y, 1, 0, Math.PI * 2);
                ctx.fill();
              });
            }
          }
        }}
        width={100}
        height={80}
        className="bg-slate-900 rounded border border-slate-800"
      />
    </div>
  );
};

export default HubDemo;
