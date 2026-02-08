import p5 from 'p5';
import { Shape2D } from '../../modules/Shape2D';

/**
 * Bakes the static interior fills of all city blocks into a p5.Graphics buffer.
 */
export const bakeShapes = (
  p: p5,
  pg: p5.Graphics,
  shapes: Shape2D[],
) => {
  pg.clear();
  pg.noStroke();
  
  // We use a consistent base color for the baked layer.
  // Dynamic highlights (hover/active) will be drawn on top in the main loop.
  pg.fill(15, 23, 42, 120); 

  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];
    pg.beginShape();
    for (let j = 0; j < shape.points.length; j++) {
      pg.vertex(shape.points[j].x, shape.points[j].y);
    }
    pg.endShape(p.CLOSE);
  }
};
