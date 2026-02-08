import p5 from 'p5';
import { Segment2D } from '../../modules/Segment2D';

/**
 * Bakes the vector shoreline boundary lines into a dedicated buffer.
 * These are intended for use when zoomed out to minimize CPU overhead.
 */
export const bakeShorelineEdge = (
  p: p5,
  pg: p5.Graphics,
  shorelines: Segment2D[]
) => {
  pg.clear();
  pg.noFill();
  pg.strokeWeight(1.5);
  pg.stroke(34, 211, 238, 180); 
  
  pg.beginShape(p.LINES);
  for (let i = 0; i < shorelines.length; i++) {
    const seg = shorelines[i];
    pg.vertex(seg.p1.x, seg.p1.y);
    pg.vertex(seg.p2.x, seg.p2.y);
  }
  pg.endShape();
};
