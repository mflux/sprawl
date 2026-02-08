import { SimpleNoise } from './FlowField';
import { River } from './River';
import { Vector2D } from './Vector2D';

export class ElevationMap {
  private noise: SimpleNoise;
  private rivers: River[] = [];

  constructor(
    public seed: number = Math.random(),
    public scale: number = 0.005,
    public octaves: number = 4,
    public persistence: number = 0.5,
    public lacunarity: number = 2.0
  ) {
    this.noise = new SimpleNoise(seed);
  }

  /**
   * Assigns a list of rivers to influence the heightmap.
   */
  setRivers(rivers: River[]) {
    this.rivers = rivers;
  }

  /**
   * Samples elevation at a world coordinate.
   * Returns a value normalized between 0 and 1.
   * Subtracts river influence to create carved valleys.
   */
  getHeight(x: number, y: number): number {
    let amplitude = 1.0;
    let frequency = this.scale;
    let noiseValue = 0;
    let maxAmplitude = 0;

    for (let i = 0; i < this.octaves; i++) {
      const sampleX = (x + this.seed * 10000) * frequency;
      const sampleY = (y + this.seed * 10000) * frequency;
      
      const val = this.noise.noise(sampleX, sampleY);
      noiseValue += val * amplitude;
      
      maxAmplitude += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    let height = (noiseValue / maxAmplitude + 1) / 2;

    // Apply River Carving
    if (this.rivers.length > 0) {
      const p = new Vector2D(x, y);
      for (const river of this.rivers) {
        const influence = river.getInfluence(p);
        if (influence > 0) {
          height -= influence * river.depth;
        }
      }
    }

    return Math.max(0, Math.min(1, height));
  }

  /**
   * Helper to determine terrain category.
   */
  getCategory(height: number, waterLevel: number = 0.3): 'water' | 'sand' | 'grass' | 'mountain' | 'snow' {
    if (height < waterLevel) return 'water';
    if (height < waterLevel + 0.05) return 'sand';
    if (height < 0.7) return 'grass';
    if (height < 0.85) return 'mountain';
    return 'snow';
  }

  /**
   * Maps height to a specific hex color.
   * Updated to a muted, monotone-leaning palette that respects the cyan vector aesthetic.
   */
  getColor(height: number, waterLevel: number = 0.3): string {
    if (height < waterLevel) {
      // Water: Deep dark teal/cyan to match vector schematic
      return '#082f49'; 
    }
    if (height < waterLevel + 0.04) {
      // Land transition: Very muted slate with a hint of warmth
      return '#0f172a'; 
    }
    if (height < 0.55) {
      // Lower land: Muted slate
      return '#1e293b'; 
    }
    if (height < 0.75) {
      // Mid land: Slightly lighter slate
      return '#334155'; 
    }
    if (height < 0.9) {
      // High land: Stone grey
      return '#475569'; 
    }
    // Peaks: Desaturated light slate
    return '#64748b'; 
  }
}