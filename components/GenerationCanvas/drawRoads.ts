
import { isBoxInView, ViewBounds } from '../../modules/Culling';
import { VisualizationSettings } from '../../types';

/**
 * Optimized drawer for secondary streets and connections.
 * Bridges are rendered with elevated shadows and structural thickness.
 */
export const drawRoads = (
  p: any, 
  roads: any[], 
  recentRoads: any[], 
  usageMap: Map<string, number>, 
  bounds: ViewBounds, 
  viz: VisualizationSettings,
  roadsGraphics?: any,
  lastBakedCount: number = 0
) => {
  const currentScale = p.drawingContext.getTransform().a;
  const baseWeight = viz.roadThickness / currentScale;
  const bridgeWeight = (viz.roadThickness * 5.5) / currentScale;
  const shadowOffset = 5.0 / currentScale;
  const baseOpacity = viz.roadOpacity;
  
  const isZoomedOut = currentScale < 2.0;
  const trafficOn = viz.renderTraffic && usageMap.size > 0;

  // 1. Base Road Layer
  if (isZoomedOut && roadsGraphics) {
    p.image(roadsGraphics, 0, 0);

    // Dynamic Frontier for growth animation
    if (lastBakedCount < roads.length) {
      p.noFill();
      
      // Draw standard road segments in the frontier
      p.strokeWeight(baseWeight);
      p.stroke(148, 163, 184, baseOpacity);
      p.beginShape(p.LINES);
      for (let i = lastBakedCount; i < roads.length; i++) {
        const r = roads[i];
        if (r.isBridge) continue;
        if (isBoxInView(Math.min(r.p1.x, r.p2.x), Math.min(r.p1.y, r.p2.y), Math.max(r.p1.x, r.p2.x), Math.max(r.p1.y, r.p2.y), bounds)) {
          p.vertex(r.p1.x, r.p1.y);
          p.vertex(r.p2.x, r.p2.y);
        }
      }
      p.endShape();

      // Draw bridge shadows in the frontier
      p.strokeWeight(bridgeWeight);
      p.stroke(0, 0, 0, 110);
      p.beginShape(p.LINES);
      for (let i = lastBakedCount; i < roads.length; i++) {
        const r = roads[i];
        if (!r.isBridge) continue;
        if (isBoxInView(Math.min(r.p1.x, r.p2.x), Math.min(r.p1.y, r.p2.y), Math.max(r.p1.x, r.p2.x), Math.max(r.p1.y, r.p2.y), bounds)) {
          p.vertex(r.p1.x + shadowOffset, r.p1.y + shadowOffset);
          p.vertex(r.p2.x + shadowOffset, r.p2.y + shadowOffset);
        }
      }
      p.endShape();

      // Draw bridge spans in the frontier
      p.stroke(200, 210, 230, baseOpacity);
      p.beginShape(p.LINES);
      for (let i = lastBakedCount; i < roads.length; i++) {
        const r = roads[i];
        if (!r.isBridge) continue;
        if (isBoxInView(Math.min(r.p1.x, r.p2.x), Math.min(r.p1.y, r.p2.y), Math.max(r.p1.x, r.p2.x), Math.max(r.p1.y, r.p2.y), bounds)) {
          p.vertex(r.p1.x, r.p1.y);
          p.vertex(r.p2.x, r.p2.y);
        }
      }
      p.endShape();
    }
  } else {
    // High-resolution dynamic batch rendering
    p.noFill();

    // Pass 1: Standard roads
    p.strokeWeight(baseWeight);
    p.stroke(148, 163, 184, baseOpacity);
    p.beginShape(p.LINES);
    for (let i = 0; i < roads.length; i++) {
      const r = roads[i];
      if (r.isBridge) continue;
      if (isBoxInView(Math.min(r.p1.x, r.p2.x), Math.min(r.p1.y, r.p2.y), Math.max(r.p1.x, r.p2.x), Math.max(r.p1.y, r.p2.y), bounds)) {
        p.vertex(r.p1.x, r.p1.y);
        p.vertex(r.p2.x, r.p2.y);
      }
    }
    p.endShape();

    // Pass 2: Bridge Shadows
    p.strokeWeight(bridgeWeight);
    p.stroke(0, 0, 0, 110);
    p.beginShape(p.LINES);
    for (let i = 0; i < roads.length; i++) {
      const r = roads[i];
      if (!r.isBridge) continue;
      if (isBoxInView(Math.min(r.p1.x, r.p2.x), Math.min(r.p1.y, r.p2.y), Math.max(r.p1.x, r.p2.x), Math.max(r.p1.y, r.p2.y), bounds)) {
        p.vertex(r.p1.x + shadowOffset, r.p1.y + shadowOffset);
        p.vertex(r.p2.x + shadowOffset, r.p2.y + shadowOffset);
      }
    }
    p.endShape();

    // Pass 3: Bridge Spans
    p.stroke(200, 210, 230, baseOpacity);
    p.beginShape(p.LINES);
    for (let i = 0; i < roads.length; i++) {
      const r = roads[i];
      if (!r.isBridge) continue;
      if (isBoxInView(Math.min(r.p1.x, r.p2.x), Math.min(r.p1.y, r.p2.y), Math.max(r.p1.x, r.p2.x), Math.max(r.p1.y, r.p2.y), bounds)) {
        p.vertex(r.p1.x, r.p1.y);
        p.vertex(r.p2.x, r.p2.y);
      }
    }
    p.endShape();
  }

  // 2. Traffic and Highlights
  const highTrafficRoads: { r: any, usage: number }[] = [];
  const visibleRecentRoads: any[] = [];

  for (let i = 0; i < roads.length; i++) {
    const r = roads[i];
    if (!isBoxInView(Math.min(r.p1.x, r.p2.x), Math.min(r.p1.y, r.p2.y), Math.max(r.p1.x, r.p2.x), Math.max(r.p1.y, r.p2.y), bounds)) continue;

    if (trafficOn) {
      const k1 = `${r.p1.x.toFixed(2)},${r.p1.y.toFixed(2)}`;
      const k2 = `${r.p2.x.toFixed(2)},${r.p2.y.toFixed(2)}`;
      const key = k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
      const usage = usageMap.get(key) || 0;
      if (usage > 0) highTrafficRoads.push({ r, usage });
    }

    if (recentRoads.length > 0 && recentRoads.includes(r)) {
      visibleRecentRoads.push(r);
    }
  }

  if (trafficOn && highTrafficRoads.length > 0) {
    for (let i = 0; i < highTrafficRoads.length; i++) {
      const { r, usage } = highTrafficRoads[i];
      const trafficFactor = Math.log10(usage + 1) * 3;
      const intensity = Math.min(255, usage * 20);
      const weight = (r.isBridge ? bridgeWeight : baseWeight) + (trafficFactor / currentScale);
      p.strokeWeight(weight);
      p.stroke(148 + intensity * 0.4, 163 + intensity * 0.2, 184 + intensity * 0.2, Math.min(255, baseOpacity + intensity));
      p.line(r.p1.x, r.p1.y, r.p2.x, r.p2.y);
    }
  }

  if (visibleRecentRoads.length > 0) {
    const pulse = Math.sin(p.frameCount * 0.2) * 0.5 + 0.5;
    p.strokeWeight(baseWeight * 2.5);
    p.stroke(34, 211, 238, 150 + pulse * 105);
    p.beginShape(p.LINES);
    for (const r of visibleRecentRoads) {
      p.vertex(r.p1.x, r.p1.y);
      p.vertex(r.p2.x, r.p2.y);
    }
    p.endShape();
  }

  // 3. High Zoom Nodes
  if (!isZoomedOut && viz.roadNodeSize > 0) {
    p.noStroke();
    const nodeAlpha = Math.min(255, viz.roadOpacity + 60);
    p.fill(255, 255, 255, nodeAlpha); 
    const s = viz.roadNodeSize / currentScale;
    const halfS = s / 2;
    for (let i = 0; i < roads.length; i++) {
      const r = roads[i];
      if (r.isBridge) continue;
      if (isBoxInView(Math.min(r.p1.x, r.p2.x), Math.min(r.p1.y, r.p2.y), Math.max(r.p1.x, r.p2.x), Math.max(r.p1.y, r.p2.y), bounds)) {
        p.rect(r.p1.x - halfS, r.p1.y - halfS, s, s);
      }
    }
  }
};
