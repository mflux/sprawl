import { isBoxInView, getPathBounds, ViewBounds } from '../../modules/Culling';
import { VisualizationSettings } from '../../types';

/**
 * Optimized drawer for global arterials.
 * - Zoomed out (< 2.0x): Uses pre-baked graphics buffer for performance.
 * - Zoomed in (>= 2.0x): Uses dynamic vectors for pixel-perfect sharpness.
 */
export const drawArterials = (
  p: any, 
  arterials: any[], 
  bounds: ViewBounds, 
  viz: VisualizationSettings,
  arterialsGraphics?: any
) => {
  const currentScale = p.drawingContext.getTransform().a;
  const isZoomedOut = currentScale < 2.0;

  if (isZoomedOut && arterialsGraphics) {
    // Distant view: render from baked texture
    p.image(arterialsGraphics, 0, 0);
  } else {
    // Close view: render high-resolution dynamic lines with AABB culling
    p.noFill();
    p.strokeWeight(viz.roadThickness / currentScale);
    p.stroke(148, 163, 184, viz.roadOpacity); 
    
    p.beginShape(p.LINES);
    for (let i = 0; i < arterials.length; i++) {
      const art = arterials[i];
      const pts = art.points;
      if (pts.length < 2) continue;

      // Spatial culling for individual arterials
      const b = getPathBounds(pts);
      if (!isBoxInView(b.minX, b.minY, b.maxX, b.maxY, bounds)) continue;

      for (let j = 0; j < pts.length - 1; j++) {
        p.vertex(pts[j].x, pts[j].y);
        p.vertex(pts[j + 1].x, pts[j + 1].y);
      }
      
      if (art.closed && pts.length > 2) {
        p.vertex(pts[pts.length - 1].x, pts[pts.length - 1].y);
        p.vertex(pts[0].x, pts[0].y);
      }
    }
    p.endShape();
  }
};
