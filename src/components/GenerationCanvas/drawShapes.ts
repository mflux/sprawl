
import { isBoxInView, getPathBounds, ViewBounds } from '../../modules/Culling';
import { VisualizationSettings } from '../../types';
import { Path2D } from '../../modules/Path2D';
import { Segment2D } from '../../modules/Segment2D';

/**
 * Draws city shapes (blocks) with a strict LOD transition.
 * - Zoomed out (< 2.0x): Uses a pre-baked graphics layer for near-zero frame cost.
 * - Zoomed in (>= 2.0x): Uses dynamic vector geometry for high-resolution crispness.
 */
export const drawShapes = (
  p: any, 
  shapes: any[], 
  arterials: Path2D[], 
  hoveredIndex: number | null, 
  activeSubdivisionIndex: number | null,
  bounds: ViewBounds, 
  _viz: VisualizationSettings,
  shapesGraphics?: any,
  processedIndices: Set<number> = new Set() // Added to show progress
) => {
  const currentScale = p.drawingContext.getTransform().a;
  const isZoomedOut = currentScale < 2.0;
  
  // 1. Static Fill Layer (Exclusive LOD)
  if (isZoomedOut && shapesGraphics) {
    // Distant view: render ONLY from buffer
    p.image(shapesGraphics, 0, 0);
  } else if (!isZoomedOut) {
    // Close view: render high-resolution dynamic shapes with spatial culling
    p.noStroke();
    
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      const b = getPathBounds(shape.points);
      
      if (isBoxInView(b.minX, b.minY, b.maxX, b.maxY, bounds)) {
        // Blocks already visited by the subdivision logic get a slightly lighter fill
        if (processedIndices.has(i)) {
          p.fill(30, 41, 59, 140); // Slate-800
        } else {
          p.fill(15, 23, 42, 120); // Slate-950
        }

        p.beginShape();
        for (let j = 0; j < shape.points.length; j++) {
          const pt = shape.points[j];
          p.vertex(pt.x, pt.y);
        }
        p.endShape(p.CLOSE);
      }
    }
  }

  // 1.5 Overlay for Processed blocks in Zoom-out mode (Ripple effect)
  if (isZoomedOut && processedIndices.size > 0 && processedIndices.size < shapes.length) {
    p.noStroke();
    p.fill(30, 41, 59, 100); 
    for (const idx of processedIndices) {
      if (idx >= shapes.length) continue;
      const shape = shapes[idx];
      const b = getPathBounds(shape.points);
      if (isBoxInView(b.minX, b.minY, b.maxX, b.maxY, bounds)) {
        p.beginShape();
        shape.points.forEach((pt: any) => p.vertex(pt.x, pt.y));
        p.endShape(p.CLOSE);
      }
    }
  }

  // 2. Active Subdivision Overlay (Always high-res vectors)
  if (activeSubdivisionIndex !== null && activeSubdivisionIndex < shapes.length) {
    const shape = shapes[activeSubdivisionIndex];
    const pulse = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
    
    p.noStroke();
    p.fill(34, 211, 238, 100 + pulse * 100); 
    p.beginShape();
    shape.points.forEach((pt: any) => p.vertex(pt.x, pt.y));
    p.endShape(p.CLOSE);

    p.push();
    p.noFill();
    p.stroke(34, 211, 238, 150);
    p.strokeWeight(6 / currentScale);
    p.beginShape();
    shape.points.forEach((pt: any) => p.vertex(pt.x, pt.y));
    p.endShape(p.CLOSE);
    p.stroke(255, 255, 255, 220);
    p.strokeWeight(2 / currentScale);
    p.beginShape();
    shape.points.forEach((pt: any) => p.vertex(pt.x, pt.y));
    p.endShape(p.CLOSE);
    p.pop();
  }

  // 3. Interaction Overlay
  if (hoveredIndex !== null && hoveredIndex < shapes.length) {
    const shape = shapes[hoveredIndex];
    const shapeBounds = getPathBounds(shape.points);
    const shapeSegments = shape.toSegments();

    p.push();
    p.colorMode(p.HSB, 360, 100, 100, 1);
    p.strokeWeight(4.0 / currentScale);
    p.noFill();

    const segmentsByArtery = new Map<number, Segment2D[]>();
    shapeSegments.forEach((ss: Segment2D) => {
      let foundArteryIdx = -1;
      for (let artIdx = 0; artIdx < arterials.length; artIdx++) {
        const artSegments = arterials[artIdx].toSegments();
        if (artSegments.some(as => as.equals(ss))) {
          foundArteryIdx = artIdx;
          break;
        }
      }
      if (foundArteryIdx !== -1) {
        if (!segmentsByArtery.has(foundArteryIdx)) segmentsByArtery.set(foundArteryIdx, []);
        segmentsByArtery.get(foundArteryIdx)!.push(ss);
      }
    });

    segmentsByArtery.forEach((segs, artIdx) => {
      const hue = (artIdx * 137.5) % 360;
      p.stroke(hue, 80, 90, 1);
      segs.forEach(s => p.line(s.p1.x, s.p1.y, s.p2.x, s.p2.y));
    });
    p.pop();

    const area = Math.abs(shape.getSignedArea());
    const centerX = (shapeBounds.minX + shapeBounds.maxX) / 2;
    const centerY = (shapeBounds.minY + shapeBounds.maxY) / 2;
    
    p.noStroke();
    p.fill(255, 255);
    p.textSize(12 / currentScale);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`${Math.floor(area / 100)} unit²`, centerX, centerY);
  }
};
