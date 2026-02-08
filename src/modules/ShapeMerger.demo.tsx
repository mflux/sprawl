
import React, { useState, useMemo } from 'react';
import { Vector2D } from './Vector2D';
import { Shape2D } from './Shape2D';
import { ShapeMerger } from './ShapeMerger';

const ShapeMergerDemo: React.FC = () => {
  const initialShapes = useMemo(() => [
    // A group of 4 adjacent blocks
    new Shape2D([new Vector2D(10, 10), new Vector2D(40, 10), new Vector2D(40, 40), new Vector2D(10, 40)]),
    new Shape2D([new Vector2D(40, 10), new Vector2D(70, 10), new Vector2D(70, 40), new Vector2D(40, 40)]),
    new Shape2D([new Vector2D(10, 40), new Vector2D(40, 40), new Vector2D(40, 70), new Vector2D(10, 70)]),
    new Shape2D([new Vector2D(40, 40), new Vector2D(70, 40), new Vector2D(70, 70), new Vector2D(40, 70)]),
    // A separate floating small shape
    new Shape2D([new Vector2D(80, 20), new Vector2D(95, 20), new Vector2D(95, 35), new Vector2D(80, 35)]),
    // A large shape to merge into
    new Shape2D([new Vector2D(80, 35), new Vector2D(95, 35), new Vector2D(95, 80), new Vector2D(80, 80)]),
  ], []);

  const [shapes, setShapes] = useState<Shape2D[]>(initialShapes);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleAutoMerge = () => {
    const merged = ShapeMerger.runAutoMerge(shapes, 1000); // 1000 is large enough to merge most demo blocks
    setShapes(merged);
    setSelectedIdx(null);
  };

  const handleReset = () => {
    setShapes(initialShapes);
    setSelectedIdx(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredIdx === null) {
      setSelectedIdx(null);
      return;
    }

    if (selectedIdx === null) {
      setSelectedIdx(hoveredIdx);
    } else {
      if (selectedIdx === hoveredIdx) {
        setSelectedIdx(null);
        return;
      }
      
      const shapeA = shapes[selectedIdx];
      const shapeB = shapes[hoveredIdx];
      
      // Check adjacency
      const neighbors = ShapeMerger.findNeighbors(shapeA, shapes);
      if (neighbors.includes(shapeB)) {
        const merged = ShapeMerger.merge(shapeA, shapeB);
        if (merged) {
          const newShapes = shapes.filter((_, i) => i !== selectedIdx && i !== hoveredIdx);
          newShapes.push(merged);
          setShapes(newShapes);
          setSelectedIdx(null);
        }
      } else {
        setSelectedIdx(hoveredIdx);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const p = new Vector2D(x, y);

    let found = null;
    for (let i = 0; i < shapes.length; i++) {
      if (shapes[i].containsPoint(p)) {
        found = i;
        break;
      }
    }
    setHoveredIdx(found);
  };

  return (
    <div className="flex flex-col items-center bg-slate-950 p-2 rounded w-full">
      <div className="flex gap-2 mb-2 w-full">
        <button 
          onClick={handleAutoMerge}
          className="flex-1 py-1 bg-cyan-600 hover:bg-cyan-500 text-[8px] font-black uppercase text-white rounded transition-colors"
        >
          Auto Merge Small
        </button>
        <button 
          onClick={handleReset}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[8px] font-black uppercase text-slate-400 rounded transition-colors border border-slate-700"
        >
          Reset
        </button>
      </div>

      <div className="relative w-full aspect-square max-w-[200px]">
        <canvas
          width={100}
          height={100}
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
          className="bg-slate-900 rounded border border-slate-800 cursor-pointer w-full h-full"
          ref={(canvas) => {
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                shapes.forEach((shape, i) => {
                  const isHovered = i === hoveredIdx;
                  const isSelected = i === selectedIdx;
                  const area = Math.abs(shape.getSignedArea());
                  
                  ctx.beginPath();
                  shape.points.forEach((p, idx) => idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                  ctx.closePath();
                  
                  if (isSelected) {
                    ctx.fillStyle = 'rgba(34, 211, 238, 0.4)';
                  } else if (isHovered) {
                    ctx.fillStyle = 'rgba(34, 211, 238, 0.2)';
                  } else {
                    ctx.fillStyle = 'rgba(51, 65, 85, 0.1)';
                  }
                  ctx.fill();

                  ctx.strokeStyle = isSelected ? '#22d3ee' : isHovered ? '#67e8f9' : '#334155';
                  ctx.lineWidth = isSelected ? 1.5 : 0.8;
                  ctx.stroke();

                  // Draw area label if hovered or selected
                  if (isHovered || isSelected) {
                    const center = shape.points.reduce((acc, p) => acc.add(p), new Vector2D(0,0)).div(shape.points.length);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 4px Inter';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${area.toFixed(0)}`, center.x, center.y);
                  }
                });
              }
            }
          }}
        />
      </div>
      <p className="text-[6px] text-slate-500 mt-2 uppercase text-center font-mono leading-tight">
        Click a block, then click an adjacent block to manually merge. <br/>
        Auto Merge clusters smaller fragments into their largest neighbors.
      </p>
    </div>
  );
};

export default ShapeMergerDemo;
