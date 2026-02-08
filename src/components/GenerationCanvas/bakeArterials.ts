
import { VisualizationSettings } from '../../types';

/**
 * Bakes the global arterial network into a p5.Graphics buffer.
 * Arterials that contain bridge segments are rendered with structural thickness and shadows.
 */
export const bakeArterials = (
  p: any,
  pg: any,
  arterials: any[],
  viz: VisualizationSettings,
) => {
  pg.clear();
  pg.noFill();
  
  const baseWeight = viz.roadThickness;
  const bridgeWeight = viz.roadThickness * 5.5;
  const shadowOffset = 5.0;

  // 1. Draw Shadows for bridge arterials first
  pg.strokeWeight(bridgeWeight);
  pg.stroke(0, 0, 0, 110);
  pg.beginShape(p.LINES);
  for (let i = 0; i < arterials.length; i++) {
    const art = arterials[i];
    const segments = art.toSegments();
    segments.forEach((seg: any) => {
      if (seg.isBridge) {
        pg.vertex(seg.p1.x + shadowOffset, seg.p1.y + shadowOffset);
        pg.vertex(seg.p2.x + shadowOffset, seg.p2.y + shadowOffset);
      }
    });
  }
  pg.endShape();

  // 2. Draw standard arterial runs
  pg.strokeWeight(baseWeight);
  pg.stroke(148, 163, 184, viz.roadOpacity); 
  pg.beginShape(p.LINES);
  for (let i = 0; i < arterials.length; i++) {
    const art = arterials[i];
    const segments = art.toSegments();
    segments.forEach((seg: any) => {
      if (!seg.isBridge) {
        pg.vertex(seg.p1.x, seg.p1.y);
        pg.vertex(seg.p2.x, seg.p2.y);
      }
    });
  }
  pg.endShape();

  // 3. Draw bridge arterial spans
  pg.strokeWeight(bridgeWeight);
  pg.stroke(200, 210, 230, viz.roadOpacity);
  pg.beginShape(p.LINES);
  for (let i = 0; i < arterials.length; i++) {
    const art = arterials[i];
    const segments = art.toSegments();
    segments.forEach((seg: any) => {
      if (seg.isBridge) {
        pg.vertex(seg.p1.x, seg.p1.y);
        pg.vertex(seg.p2.x, seg.p2.y);
      }
    });
  }
  pg.endShape();
};
