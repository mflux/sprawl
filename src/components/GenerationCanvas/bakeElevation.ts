import p5 from 'p5';
import { ElevationMap } from '../../modules/ElevationMap';

/**
 * Bakes the elevation map into a p5.Graphics buffer with relief shading.
 * Uses finite difference to calculate surface normals and simulates 
 * a top-left light source for a 3D topographic effect.
 * 
 * Gradient calculation is normalized by resolution to maintain visual 
 * consistency across different LOD scales.
 */
export const bakeElevation = (
  p: p5, 
  pg: p5.Graphics, 
  elevation: ElevationMap, 
  waterLevel: number, 
  originX: number, 
  originY: number, 
  res: number
) => {
  pg.pixelDensity(1);
  pg.loadPixels();
  
  const w = pg.width;
  const h = pg.height;
  
  // Light source from Top-Left
  const lx = -0.5;
  const ly = -0.5;
  const lz = 0.707;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const worldX = originX + x * res;
      const worldY = originY + y * res;
      
      const hCenter = elevation.getHeight(worldX, worldY);
      
      let shading = 1.0;
      
      if (hCenter >= waterLevel) {
        const eps = res;
        const hL = elevation.getHeight(worldX - eps, worldY);
        const hR = elevation.getHeight(worldX + eps, worldY);
        const hU = elevation.getHeight(worldX, worldY - eps);
        const hD = elevation.getHeight(worldX, worldY + eps);

        // Normalize gradient by resolution to prevent "flattening" at high res
        const strength = 750.0; 
        const nx = -(hR - hL) * (strength / eps);
        const ny = -(hD - hU) * (strength / eps);
        const nz = 1.0;
        
        const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
        const dot = (nx / nLen * lx) + (ny / nLen * ly) + (nz / nLen * lz);
        
        shading = p.map(dot, 0.1, 0.9, 0.8, 1.2);
      }

      const idx = (x + y * w) * 4;
      const colorHex = elevation.getColor(hCenter, waterLevel);
      const baseColor = p.color(colorHex);
      
      pg.pixels[idx] = p.constrain(p.red(baseColor) * shading, 0, 255);
      pg.pixels[idx + 1] = p.constrain(p.green(baseColor) * shading, 0, 255);
      pg.pixels[idx + 2] = p.constrain(p.blue(baseColor) * shading, 0, 255);
      pg.pixels[idx + 3] = 255;
    }
  }
  pg.updatePixels();
};