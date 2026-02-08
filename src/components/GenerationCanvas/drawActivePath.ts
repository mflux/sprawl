import p5 from 'p5';
import { Vector2D } from '../../modules/Vector2D';
import { getCanvasScale } from '../../utils/canvas';

/**
 * Draws the active calculated path for Step 5.
 */
export const drawActivePath = (p: p5, path: Vector2D[] | null) => {
  if (!path || path.length < 2) return;

  const currentScale = getCanvasScale(p);
  
  // Outer glow
  p.noFill();
  p.stroke(34, 211, 238, 80);
  p.strokeWeight(8 / currentScale);
  p.beginShape();
  path.forEach(pt => p.vertex(pt.x, pt.y));
  p.endShape();

  // Core line
  p.stroke(255, 255, 255, 255);
  p.strokeWeight(2.5 / currentScale);
  p.beginShape();
  path.forEach(pt => p.vertex(pt.x, pt.y));
  p.endShape();

  // Pulsing dots along the path
  const time = p.frameCount * 0.1;
  p.fill(255, 255, 255);
  p.noStroke();
  path.forEach((pt, i) => {
    const pulse = Math.sin(time - i * 0.5) * 0.5 + 0.5;
    if (pulse > 0.8) {
      p.circle(pt.x, pt.y, 4 * pulse / currentScale);
    }
  });
};
