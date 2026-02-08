import { FlowField } from '../../modules/FlowField';

/**
 * Bakes the entire flow field into a p5.Graphics buffer.
 */
export const bakeFlowField = (p: any, pg: any, field: FlowField) => {
  pg.clear();
  pg.push();
  pg.colorMode(p.HSB, 360, 100, 100, 1);
  
  const alpha = 0.25;
  pg.strokeWeight(1.2);
  
  const res = field.resolution;
  const lineLen = 15;

  pg.translate(-field.originX, -field.originY);

  for (let x = 0; x < field.cols; x++) {
    for (let y = 0; y < field.rows; y++) {
      const worldX = field.originX + x * res;
      const worldY = field.originY + y * res;
      
      const v = field.getVectorAt(worldX, worldY);
      if (v.mag() === 0) continue;
      
      const angle = Math.atan2(v.y, v.x);
      const hue = (p.degrees(angle) + 360) % 360;
      
      pg.stroke(hue, 80, 90, alpha);
      pg.line(worldX, worldY, worldX + v.x * lineLen, worldY + v.y * lineLen);
      
      pg.strokeWeight(2);
      pg.point(worldX, worldY);
      pg.strokeWeight(1.2);
    }
  }
  pg.pop();
};
