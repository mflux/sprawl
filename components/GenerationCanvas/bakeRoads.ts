
import { VisualizationSettings } from '../../types';

/**
 * Bakes the secondary road network into a p5.Graphics buffer.
 * Includes structural bridge details and relief-aligned shadows.
 */
export const bakeRoads = (
  p: any,
  pg: any,
  roads: any[],
  viz: VisualizationSettings
) => {
  pg.clear();
  pg.noFill();
  
  const baseWeight = viz.roadThickness;
  const bridgeWeight = viz.roadThickness * 5.5;
  const shadowOffset = 5.0;
  
  // 1. Standard Roads
  pg.strokeWeight(baseWeight);
  pg.stroke(148, 163, 184, viz.roadOpacity); 
  pg.beginShape(p.LINES);
  for (let i = 0; i < roads.length; i++) {
    const r = roads[i];
    if (!r.isBridge) {
      pg.vertex(r.p1.x, r.p1.y);
      pg.vertex(r.p2.x, r.p2.y);
    }
  }
  pg.endShape();

  // 2. Bridge Shadows
  pg.strokeWeight(bridgeWeight);
  pg.stroke(0, 0, 0, 110);
  pg.beginShape(p.LINES);
  for (let i = 0; i < roads.length; i++) {
    const r = roads[i];
    if (r.isBridge) {
      pg.vertex(r.p1.x + shadowOffset, r.p1.y + shadowOffset);
      pg.vertex(r.p2.x + shadowOffset, r.p2.y + shadowOffset);
    }
  }
  pg.endShape();

  // 3. Bridge Spans
  pg.strokeWeight(bridgeWeight);
  pg.stroke(200, 210, 230, viz.roadOpacity);
  pg.beginShape(p.LINES);
  for (let i = 0; i < roads.length; i++) {
    const r = roads[i];
    if (r.isBridge) {
      pg.vertex(r.p1.x, r.p1.y);
      pg.vertex(r.p2.x, r.p2.y);
    }
  }
  pg.endShape();
};
