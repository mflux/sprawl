import p5 from 'p5';
import { ViewBounds } from '../../modules/Culling';
import { getCanvasScale } from '../../utils/canvas';

/**
 * Draws the background schematic grid.
 */
export const drawGrid = (p: p5, bounds: ViewBounds) => {
  const currentScale = getCanvasScale(p);
  p.stroke(51, 65, 85, 10); 
  p.strokeWeight(1 / currentScale);
  
  const gridSize = 40;
  
  const startX = Math.floor(bounds.minX / gridSize) * gridSize;
  const endX = Math.ceil(bounds.maxX / gridSize) * gridSize;
  const startY = Math.floor(bounds.minY / gridSize) * gridSize;
  const endY = Math.ceil(bounds.maxY / gridSize) * gridSize;

  const skip = currentScale < 0.2 ? 4 : 1;

  for (let x = startX; x <= endX; x += gridSize * skip) p.line(x, bounds.minY, x, bounds.maxY);
  for (let y = startY; y <= endY; y += gridSize * skip) p.line(bounds.minX, y, bounds.maxX, y);
};
