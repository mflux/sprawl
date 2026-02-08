
import { Vector2D } from './Vector2D';

// Fixed: Added ref property and ensured property names match usage in relax()
export interface Label {
  id: string;
  anchor: Vector2D;
  pos: Vector2D;
  width: number;
  height: number;
  ref?: any;
}

export class LabelRelaxer {
  /**
   * Runs a simple force-directed simulation to separate overlapping labels.
   * Uses a combination of overlap repulsion and anchor attraction.
   */
  static relax(labels: Label[], iterations: number = 50, buffer: number = 10): Label[] {
    const results = labels.map(l => ({ ...l, pos: l.pos.copy() }));
    
    const attractionStrength = 0.05;
    const repulsionStrength = 0.4;

    for (let i = 0; i < iterations; i++) {
      for (let j = 0; j < results.length; j++) {
        const l1 = results[j];
        
        // 1. Attraction to original anchor point
        const toAnchor = l1.anchor.sub(l1.pos);
        l1.pos = l1.pos.add(toAnchor.mul(attractionStrength));

        // 2. Repulsion from other labels
        for (let k = 0; k < results.length; k++) {
          if (j === k) continue;
          const l2 = results[k];

          const dx = l1.pos.x - l2.pos.x;
          const dy = l1.pos.y - l2.pos.y;
          
          const minXDist = (l1.width + l2.width) / 2 + buffer;
          const minYDist = (l1.height + l2.height) / 2 + buffer;

          if (Math.abs(dx) < minXDist && Math.abs(dy) < minYDist) {
            // Overlapping
            const pushX = (minXDist - Math.abs(dx)) * Math.sign(dx || (Math.random() - 0.5));
            const pushY = (minYDist - Math.abs(dy)) * Math.sign(dy || (Math.random() - 0.5));
            
            // Push proportionally to avoid sudden jumps
            l1.pos.x += pushX * repulsionStrength;
            l1.pos.y += pushY * repulsionStrength;
          }
        }
      }
    }

    return results;
  }

  /**
   * Estimates label dimensions based on character count and font scale.
   */
  // Fixed: Renamed w/h to width/height to match Label interface and usage in relax()
  static estimateDimensions(text: string, scale: number): { width: number, height: number } {
    // Basic heuristic: 0.6w per char for average proportional font, height fixed to roughly 1em
    const charWidth = 8;
    const charHeight = 16;
    return {
      width: (text.length * charWidth) / scale,
      height: charHeight / scale
    };
  }
}
