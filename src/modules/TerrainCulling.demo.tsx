
import React, { useMemo } from 'react';
import { Vector2D } from './Vector2D';
import { Segment2D } from './Segment2D';
import { ElevationMap } from './ElevationMap';
import { TerrainCulling } from './TerrainCulling';

const TerrainCullingDemo: React.FC = () => {
  const waterLevel = 0.45;
  const seed = 0.123;
  const elevation = useMemo(() => new ElevationMap(seed, 0.02), []);

  const data = useMemo(() => {
    const raw: Segment2D[] = [];
    for (let i = 0; i < 40; i++) {
      const p1 = new Vector2D(Math.random() * 100, Math.random() * 100);
      const angle = Math.random() * Math.PI * 2;
      const p2 = p1.add(new Vector2D(Math.cos(angle) * 15, Math.sin(angle) * 15));
      raw.push(new Segment2D(p1, p2));
    }

    const culled = TerrainCulling.cullSegments(raw, elevation, waterLevel);
    return { raw, culled };
  }, [elevation, waterLevel]);

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded w-full">
      <div className="flex justify-between w-full px-2 mb-2">
        <span className="text-[7px] font-black uppercase text-cyan-400 tracking-widest">Hydrological Culling</span>
        <span className="text-[7px] font-mono text-slate-500 uppercase">Removed {data.raw.length - data.culled.length} segments</span>
      </div>
      <canvas
        ref={(canvas) => {
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              // Draw Background
              const w = canvas.width;
              const h = canvas.height;
              const imgData = ctx.createImageData(w, h);
              for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                  const height = elevation.getHeight(x, y);
                  const color = elevation.getColor(height, waterLevel);
                  const idx = (y * w + x) * 4;
                  imgData.data[idx] = parseInt(color.slice(1, 3), 16);
                  imgData.data[idx+1] = parseInt(color.slice(3, 5), 16);
                  imgData.data[idx+2] = parseInt(color.slice(5, 7), 16);
                  imgData.data[idx+3] = 180;
                }
              }
              ctx.putImageData(imgData, 0, 0);

              // Draw Raw (culled in red)
              ctx.setLineDash([2, 2]);
              ctx.lineWidth = 0.5;
              data.raw.forEach(seg => {
                const isKept = data.culled.some(c => c.equals(seg));
                if (!isKept) {
                  ctx.strokeStyle = '#f43f5e';
                  ctx.beginPath();
                  ctx.moveTo(seg.p1.x, seg.p1.y);
                  ctx.lineTo(seg.p2.x, seg.p2.y);
                  ctx.stroke();
                }
              });
              ctx.setLineDash([]);

              // Draw Kept (Cyan)
              ctx.lineWidth = 1.5;
              ctx.strokeStyle = '#22d3ee';
              data.culled.forEach(seg => {
                ctx.beginPath();
                ctx.moveTo(seg.p1.x, seg.p1.y);
                ctx.lineTo(seg.p2.x, seg.p2.y);
                ctx.stroke();
              });
            }
          }
        }}
        width={100}
        height={100}
        className="bg-slate-900 rounded border border-slate-800 w-full aspect-square max-w-[200px]"
      />
      <div className="mt-2 text-[6px] text-slate-500 uppercase font-mono text-center px-2">
        Red Dashed = Submerged (culled) <br/>
        Solid Cyan = Terrestrial (preserved)
      </div>
    </div>
  );
};

export default TerrainCullingDemo;
