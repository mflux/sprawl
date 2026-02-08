import p5 from 'p5';
import { isBoxInView, ViewBounds } from '../../modules/Culling';
import { Hub } from '../../modules/Hub';
import { getCanvasScale } from '../../utils/canvas';

/**
 * Draws urban hubs with an dramatic entry animation.
 */
export const drawHubs = (p: p5, hubs: Hub[], bounds: ViewBounds) => {
  const currentScale = getCanvasScale(p);
  const now = Date.now();

  hubs.forEach(hub => {
    if (!isBoxInView(hub.position.x - hub.size * 2, hub.position.y - hub.size * 2, hub.position.x + hub.size * 2, hub.position.y + hub.size * 2, bounds)) return;

    const age = now - (hub.spawnTime || 0);
    const isSpawning = age < 1500;

    // 1. Spawning Animation (Ripples and Impacts)
    if (isSpawning) {
      const progress = age / 1500; // 0 to 1
      const invProgress = 1 - progress;
      
      p.push();
      p.noFill();
      
      // Impact Shockwave
      const shockSize = hub.size * 6 * progress;
      p.stroke(34, 211, 238, 200 * invProgress);
      p.strokeWeight(4 / currentScale);
      p.circle(hub.position.x, hub.position.y, shockSize);

      // Multiple Secondary Ripples
      for (let i = 0; i < 3; i++) {
        const rProgress = (progress + (i * 0.2)) % 1;
        const rSize = hub.size * 4 * rProgress;
        p.stroke(34, 211, 238, 100 * (1 - rProgress));
        p.strokeWeight(1 / currentScale);
        p.circle(hub.position.x, hub.position.y, rSize);
      }

      // Initial Flash
      if (age < 300) {
        const flashAlpha = p.map(age, 0, 300, 255, 0);
        p.fill(255, 255, 255, flashAlpha);
        p.noStroke();
        p.circle(hub.position.x, hub.position.y, hub.size * 2.5);
      }
      
      p.pop();
    }

    // 2. Base Hub Visuals
    const spawnScale = isSpawning ? p.map(Math.min(age, 500), 0, 500, 0, 1) : 1;
    const pulse = Math.sin(p.frameCount * 0.05) * 0.1 + 1.0;
    const finalSize = hub.size * spawnScale * pulse;

    p.noStroke();
    p.fill(34, 211, 238, 12); 
    p.circle(hub.position.x, hub.position.y, finalSize * 2.2);
    
    p.stroke(34, 211, 238, 80); 
    p.strokeWeight(2 / currentScale);
    p.noFill();
    p.circle(hub.position.x, hub.position.y, finalSize * 2);
    
    // Core indicator
    p.fill(255, 255, 255, 220);
    p.noStroke();
    p.circle(hub.position.x, hub.position.y, 4 / currentScale);
    
    // High-energy core glow
    p.fill(34, 211, 238, 100);
    p.circle(hub.position.x, hub.position.y, 8 / currentScale);
  });
};