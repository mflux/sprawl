
/**
 * Draws transient simulation events.
 */
export const drawEvents = (p: any, events: any[]) => {
  const currentScale = p.drawingContext.getTransform().a;
  const now = Date.now();
  events.forEach(ev => {
    const age = now - ev.timestamp;
    if (age > 1500) return;

    if (ev.type === 'death_collision') {
      const progress = age / 1200;
      const alpha = p.lerp(200, 0, progress);
      p.noFill();
      p.strokeWeight(2 / currentScale);
      p.stroke(244, 63, 94, alpha);
      p.circle(ev.position.x, ev.position.y, (progress * 40) / currentScale);
    } else if (ev.type === 'target_reached') {
      const progress = age / 800;
      const alpha = p.lerp(120, 0, progress);
      p.noFill();
      p.stroke(34, 211, 238, alpha);
      p.circle(ev.position.x, ev.position.y, (progress * 20) / currentScale);
    } else if (ev.type === 'bridge_started') {
      const progress = age / 1500;
      const alpha = p.lerp(180, 0, progress);
      p.noFill();
      p.stroke(34, 211, 238, alpha);
      p.strokeWeight(2 / currentScale);
      // Simple expanding indicator at the bridge origin
      p.circle(ev.position.x, ev.position.y, (progress * 60) / currentScale);
    } else if (ev.type === 'death_oob') {
      const progress = age / 1000;
      const alpha = p.lerp(150, 0, progress);
      p.noFill();
      p.stroke(244, 63, 94, alpha);
      p.rect(ev.position.x - 5, ev.position.y - 5, 10, 10);
    } else if (ev.type === 'death_water') {
      const progress = age / 1000;
      const alpha = p.lerp(200, 0, progress);
      p.noFill();
      p.strokeWeight(1 / currentScale);
      p.stroke(34, 211, 238, alpha);
      p.circle(ev.position.x, ev.position.y, (progress * 30) / currentScale);
      p.stroke(255, 255, 255, alpha * 0.5);
      p.circle(ev.position.x, ev.position.y, (progress * 15) / currentScale);
    } else if (ev.type === 'death_stale') {
      const progress = age / 1000;
      const alpha = p.lerp(180, 0, progress);
      p.stroke(217, 119, 6, alpha); 
      p.strokeWeight(1.5 / currentScale);
      const size = 6 / currentScale;
      p.line(ev.position.x - size, ev.position.y - size, ev.position.x + size, ev.position.y + size);
      p.line(ev.position.x + size, ev.position.y - size, ev.position.x - size, ev.position.y + size);
    } else if (ev.type === 'shapes_detected' || ev.type === 'arterials_detected') {
      const progress = age / 1000;
      const alpha = p.lerp(80, 0, progress);
      p.noFill();
      p.stroke(34, 211, 238, alpha);
      p.push();
      p.resetMatrix();
      p.strokeWeight(progress * 15);
      p.rect(0, 0, p.width, p.height);
      p.pop();
    }
  });
};
