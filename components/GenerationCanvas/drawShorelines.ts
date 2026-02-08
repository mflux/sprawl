import { isBoxInView, ViewBounds } from '../../modules/Culling';

/**
 * Draws the shoreline layer with an LOD system.
 * - Interior detail (dots/fill) is always rendered from a baked buffer.
 * - Boundary vectors:
 *   - Zoomed out (< 2.0x): Uses the pre-baked edge graphics buffer.
 *   - Zoomed in (>= 2.0x): Uses dynamic crisp lines for visual quality.
 */
export const drawShorelines = (
  p: any, 
  shorelines: any[], 
  bounds: ViewBounds, 
  shorelineInteriorGraphics?: any,
  shorelineEdgeGraphics?: any
) => {
  const currentScale = p.drawingContext.getTransform().a;
  
  // 1. Always draw the baked foundation (dots and technical water fill)
  if (shorelineInteriorGraphics) {
    p.image(shorelineInteriorGraphics, 0, 0);
  }

  // 2. Determine whether to draw baked or dynamic edge geometry
  if (currentScale < 2.0) {
    // Distant view: draw the baked low-res edge buffer
    if (shorelineEdgeGraphics) {
      p.image(shorelineEdgeGraphics, 0, 0);
    }
  } else if (shorelines.length > 0) {
    // Close view: draw crisp, high-resolution dynamic vectors with spatial culling
    p.noFill();
    // Line thickness is normalized to world units to stay sharp
    p.strokeWeight(1.5 / currentScale);
    p.stroke(34, 211, 238, 255); 
    
    p.beginShape(p.LINES);
    for (let i = 0; i < shorelines.length; i++) {
      const seg = shorelines[i];
      
      const minX = seg.p1.x < seg.p2.x ? seg.p1.x : seg.p2.x;
      const maxX = seg.p1.x > seg.p2.x ? seg.p1.x : seg.p2.x;
      const minY = seg.p1.y < seg.p2.y ? seg.p1.y : seg.p2.y;
      const maxY = seg.p1.y > seg.p2.y ? seg.p1.y : seg.p2.y;
      
      if (isBoxInView(minX, minY, maxX, maxY, bounds)) {
        p.vertex(seg.p1.x, seg.p1.y);
        p.vertex(seg.p2.x, seg.p2.y);
      }
    }
    p.endShape();
  }
};