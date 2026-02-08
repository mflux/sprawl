import { GeographyMetadata } from '../../types';
import { ViewBounds, isBoxInView } from '../../modules/Culling';

/**
 * Renders labels for city features with a Google Maps-style LOD system.
 * Labels fade in and out based on importance (Tier, Area) and current zoom scale.
 */
export const drawNames = (p: any, geo: GeographyMetadata, bounds: ViewBounds) => {
  const currentScale = p.drawingContext.getTransform().a;
  
  // Hard visibility floor
  if (currentScale < 0.08) return;

  p.textAlign(p.CENTER, p.CENTER);
  p.noStroke();

  /**
   * Calculates a smooth alpha [0-255] based on scale thresholds.
   * Ramps up at startScale, ramps down at endScale.
   */
  const calculateLODAlpha = (scale: number, start: number, end: number, fade: number = 0.1) => {
    if (scale < start - fade || scale > end + fade) return 0;
    
    let alpha = 255;
    // Fade in
    if (scale < start) {
      alpha = p.map(scale, start - fade, start, 0, 255);
    }
    // Fade out
    else if (scale > end) {
      alpha = p.map(scale, end, end + fade, 255, 0);
    }
    
    return p.constrain(alpha, 0, 255);
  };

  const getWorldTextSize = (baseSize: number, minScreen: number, maxScreen: number) => {
    const screenPx = baseSize * currentScale;
    const clampedPx = p.constrain(screenPx, minScreen, maxScreen);
    return clampedPx / currentScale; 
  };

  // 1. Water Body Names (LOD based on Area)
  // Large bodies visible early, small bodies only when zoomed in.
  geo.waterBodies.forEach(w => {
    if (!w.name) return;
    const areaFactor = w.area / 100000; // Normalized importance
    const startScale = p.lerp(0.5, 0.12, p.constrain(areaFactor, 0, 1));
    const alpha = calculateLODAlpha(currentScale, startScale, 10.0, 0.05);
    
    if (alpha <= 0) return;
    if (!isBoxInView(w.center.x, w.center.y, w.center.x, w.center.y, bounds)) return;

    const lx = w.center.x + (w.labelOffset?.x || 0);
    const ly = w.center.y + (w.labelOffset?.y || 0);

    p.textSize(getWorldTextSize(16, 9, 45));
    p.textStyle(p.ITALIC);
    
    p.fill(0, 0, 0, (alpha / 255) * 160);
    const offset = 1.2 / currentScale;
    p.text(w.name, lx + offset, ly + offset);
    
    p.fill(56, 189, 248, (alpha / 255) * 220); 
    p.text(w.name, lx, ly);
  });

  // 2. Notable District Names (LOD starts at high-zoom for local details)
  geo.notableShapes.forEach(s => {
    if (!s.name) return;
    // Districts appear as you move deep into the city view (1.2x scale or more)
    const alpha = calculateLODAlpha(currentScale, 1.2, 15.0, 0.15);
    
    if (alpha <= 0) return;
    if (!isBoxInView(s.center.x, s.center.y, s.center.x, s.center.y, bounds)) return;

    const lx = s.center.x + (s.labelOffset?.x || 0);
    const ly = s.center.y + (s.labelOffset?.y || 0);

    p.textSize(getWorldTextSize(18, 10, 50));
    p.textStyle(p.NORMAL);

    p.fill(0, 0, 0, (alpha / 255) * 180);
    const offset = 1.2 / currentScale;
    p.text(s.name, lx + offset, ly + offset);
    
    p.fill(241, 245, 249, (alpha / 255) * 240); 
    p.text(s.name, lx, ly);
  });

  // 3. Bridge Names (LOD: Very High Zoom only)
  geo.bridges.forEach(b => {
    if (!b.name) return;
    const alpha = calculateLODAlpha(currentScale, 1.8, 20.0, 0.2);
    
    if (alpha <= 0) return;
    if (!isBoxInView(b.midpoint.x, b.midpoint.y, b.midpoint.x, b.midpoint.y, bounds)) return;

    const lx = b.midpoint.x + (b.labelOffset?.x || 0);
    const ly = b.midpoint.y + (b.labelOffset?.y || 0);

    p.textSize(getWorldTextSize(14, 8, 30));
    p.textStyle(p.ITALIC);

    p.fill(0, 0, 0, (alpha / 255) * 180);
    const offset = 1.0 / currentScale;
    p.text(b.name, lx + offset, ly + offset);

    p.fill(148, 163, 184, (alpha / 255) * 255); 
    p.text(b.name, lx, ly);
  });

  // 4. Hub Names (LOD: Handover from Region to City)
  // Major Hubs (Tier 1) fade out as we get deep into the city grid.
  geo.hubs.forEach(h => {
    if (!h.name) return;
    
    // Tier 1 hubs visible far out, Tier 3 only mid-range.
    // All Hubs fade out at high zoom to clear space for local labels.
    let startScale = 0.1;
    let endScale = 1.2;

    if (h.tier === 2) {
      startScale = 0.18;
      endScale = 2.0;
    } else if (h.tier === 3) {
      startScale = 0.3;
      endScale = 3.5;
    }

    const alpha = calculateLODAlpha(currentScale, startScale, endScale, 0.1);
    
    if (alpha <= 0) return;
    if (!isBoxInView(h.position.x, h.position.y, h.position.x, h.position.y, bounds)) return;
    
    const lx = h.position.x + (h.labelOffset?.x || 0);
    const ly = h.position.y + (h.labelOffset?.y || 0);

    p.textSize(getWorldTextSize(26, 14, 70));
    p.textStyle(p.BOLD);

    p.fill(0, 0, 0, (alpha / 255) * 220);
    const offset = 1.5 / currentScale;
    p.text(h.name, lx + offset, ly + offset);
    
    p.fill(34, 211, 238, (alpha / 255) * 255); 
    p.text(h.name, lx, ly);
  });
  
  p.textStyle(p.NORMAL);
};