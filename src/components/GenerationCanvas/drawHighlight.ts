import p5 from 'p5';
import { getCanvasScale } from '../../utils/canvas';

/**
 * Draws a downward pointing highlight arrow at the specified position.
 */
export const drawHighlight = (p: p5, x: number, y: number) => {
  const currentScale = getCanvasScale(p);
  const time = p.frameCount * 0.1;
  const bounce = Math.sin(time) * (10 / currentScale);
  
  const arrowY = y + bounce - (25 / currentScale);
  const arrowSize = 15 / currentScale;

  p.push();
  p.translate(x, arrowY);
  
  // Outer glow
  p.noStroke();
  p.fill(34, 211, 238, 50);
  p.triangle(
    -arrowSize * 1.5, -arrowSize * 1.2, 
    arrowSize * 1.5, -arrowSize * 1.2, 
    0, arrowSize * 0.8
  );

  // Core arrow
  p.fill(34, 211, 238, 255);
  p.stroke(255, 255, 255, 200);
  p.strokeWeight(2 / currentScale);
  p.triangle(
    -arrowSize, -arrowSize, 
    arrowSize, -arrowSize, 
    0, 0
  );

  // Pulsing dot at tip
  p.noStroke();
  p.fill(255, 255, 255, 200 + Math.sin(time * 2) * 55);
  p.circle(0, 0, 4 / currentScale);

  p.pop();
};
