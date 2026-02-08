import { ElevationMap } from '../../modules/ElevationMap';

/**
 * Bakes the internal technical "water" indicators: dot matrix and faint underlay.
 */
export const bakeShorelineInterior = (
  pg: any,
  elevation: ElevationMap,
  waterLevel: number,
  width: number,
  height: number
) => {
  pg.clear();
  
  // 1. Draw the high-density technical dot matrix (Interior)
  const dotSpacing = 16;
  pg.stroke(34, 211, 238, 140); 
  pg.strokeWeight(2);
  
  for (let x = 0; x <= width; x += dotSpacing) {
    for (let y = 0; y <= height; y += dotSpacing) {
      if (elevation.getHeight(x, y) < waterLevel) {
        pg.point(x, y);
      }
    }
  }

  // 2. Draw a faint solid underlay for better shape recognition
  pg.noStroke();
  pg.fill(34, 211, 238, 10);
  const fillRes = 32;
  for (let x = 0; x <= width; x += fillRes) {
    for (let y = 0; y <= height; y += fillRes) {
      if (elevation.getHeight(x + fillRes/2, y + fillRes/2) < waterLevel) {
        pg.rect(x, y, fillRes, fillRes);
      }
    }
  }
};
