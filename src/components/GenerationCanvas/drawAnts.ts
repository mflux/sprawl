import p5 from 'p5';
import { isBoxInView, ViewBounds } from '../../modules/Culling';
import { Ant } from '../../modules/Ant';
import { VisualizationSettings } from '../../types';
import { getCanvasScale } from '../../utils/canvas';

/**
 * Draws autonomous agents (Ants).
 * Colors agents based on their spawning origin (Hub, Termination, or Perpendicular).
 */
export const drawAnts = (p: p5, ants: Ant[], bounds: ViewBounds, viz: VisualizationSettings) => {
  const currentScale = getCanvasScale(p);
  ants.forEach(ant => {
    if (!ant.isAlive) return;
    if (!isBoxInView(ant.position.x, ant.position.y, ant.position.x, ant.position.y, bounds)) return;
    
    const isFork = ant.type === 'fork';
    if (isFork && !viz.showForkAgents) return;

    // Ant color is stored in the class instance based on its type
    const antColor = ant.color || '#fbbf24';
    const agentSizeMult = isFork ? 1.5 : 1.0;
    
    p.stroke(antColor);
    p.strokeWeight((isFork ? 2.5 : 1.5) / currentScale);
    p.line(
      ant.position.x, 
      ant.position.y, 
      ant.position.x - ant.direction.x * (viz.agentVectorLength * (isFork ? 1.5 : 1.0) / currentScale), 
      ant.position.y - ant.direction.y * (viz.agentVectorLength * (isFork ? 1.5 : 1.0) / currentScale)
    );

    p.noStroke();
    p.fill(255, 255, 255, 255);
    p.circle(ant.position.x, ant.position.y, (viz.agentSize * agentSizeMult) / currentScale);
    
    const glowColor = p.color(antColor);
    glowColor.setAlpha(isFork ? 120 : 80);
    p.fill(glowColor);
    p.circle(ant.position.x, ant.position.y, (viz.agentSize * (isFork ? 3.5 : 2.0)) / currentScale);
    
    // Add extra scanning effect for fork agents
    if (isFork) {
      p.noFill();
      p.stroke(antColor);
      p.strokeWeight(1 / currentScale);
      p.circle(ant.position.x, ant.position.y, (viz.agentSize * 6 * Math.abs(Math.sin(p.frameCount * 0.1))) / currentScale);
    }
  });
};
