import p5 from 'p5';
import { isBoxInView, ViewBounds } from '../../modules/Culling';
import { Vector2D } from '../../modules/Vector2D';
import { getCanvasScale } from '../../utils/canvas';

/**
 * Draws the map entry/exit points at the boundaries.
 */
export const drawExits = (p: p5, exits: Vector2D[], bounds: ViewBounds) => {
  const currentScale = getCanvasScale(p);
  
  exits.forEach(exit => {
    if (!isBoxInView(exit.x - 10, exit.y - 10, exit.x + 10, exit.y + 10, bounds)) return;

    // Schematic marker: Triangle pointing outward or Square
    p.noStroke();
    p.fill(250, 204, 21, 180); // Amber-400
    
    const size = 10 / currentScale;
    const half = size / 2;
    p.rect(exit.x - half, exit.y - half, size, size);
    
    // Pulse effect
    const pulse = (p.frameCount * 0.05) % 1;
    p.noFill();
    p.stroke(250, 204, 21, 200 * (1 - pulse));
    p.strokeWeight(1 / currentScale);
    p.rect(exit.x - half - pulse * 10, exit.y - half - pulse * 10, size + pulse * 20, size + pulse * 20);
  });
};
