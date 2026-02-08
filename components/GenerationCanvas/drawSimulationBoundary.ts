/**
 * Draws the boundary of the simulation world.
 */
export const drawSimulationBoundary = (p: any, width: number, height: number) => {
  const currentScale = p.drawingContext.getTransform().a;
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
