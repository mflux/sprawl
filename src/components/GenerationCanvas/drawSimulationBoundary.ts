import p5 from 'p5';
import { getCanvasScale } from '../../utils/canvas';

/**
 * Draws the boundary of the simulation world.
 */
export const drawSimulationBoundary = (p: p5, width: number, height: number) => {
  const currentScale = getCanvasScale(p);
  p.noFill();
  p.stroke(226, 232, 240, 40); 
  p.strokeWeight(2 / currentScale);
  p.rect(0, 0, width, height);
  
  p.fill(0, 0, 0, 150);
  p.noStroke();
  
  const large = 10000;
  p.rect(-large, -large, large * 2 + width, large); 
  p.rect(-large, height, large * 2 + width, large); 
  p.rect(-large, 0, large, height); 
  p.rect(width, 0, large, height); 
};
