import { Vector2D } from './Vector2D';

/**
 * A simple 2D Noise utility for deterministic testing and standalone use.
 * Uses a seeded shuffle to ensure consistency across threads.
 */
export class SimpleNoise {
  private p: number[] = new Array(512);

  constructor(seedValue: number = 0.5) {
    const permutation = Array.from({ length: 256 }, (_, i) => i);
    
    // Seeded Fisher-Yates shuffle using LCG
    let seed = Math.floor(seedValue * 10000);
    for (let i = 255; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = Math.floor((seed / 233280) * (i + 1));
      [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
    }

    for (let i = 0; i < 256; i++) {
      this.p[i] = this.p[i + 256] = permutation[i];
    }
  }

  fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(t: number, a: number, b: number) { return a + t * (b - a); }
  grad(hash: number, x: number, y: number) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = this.fade(x);
    const v = this.fade(y);
    const A = this.p[X] + Y, AA = this.p[A], AB = this.p[A + 1];
    const B = this.p[X + 1] + Y, BA = this.p[B], BB = this.p[B + 1];

    return this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y),
                                     this.grad(this.p[BA], x - 1, y)),
                         this.lerp(u, this.grad(this.p[AB], x, y - 1),
                                     this.grad(this.p[BB], x - 1, y - 1)));
  }
}

export class FlowField {
  protected grid: Vector2D[][] = [];
  public noiseGen: SimpleNoise;
  public cols: number;
  public rows: number;

  constructor(
    public width: number,
    public height: number,
    public resolution: number = 20,
    public originX: number = 0,
    public originY: number = 0,
    public scaleLarge: number = 0.05,
    public scaleSmall: number = 0.2,
    seed: number = 0.5
  ) {
    this.noiseGen = new SimpleNoise(seed);
    this.cols = Math.ceil(width / resolution) + 1;
    this.rows = Math.ceil(height / resolution) + 1;
    this.generate(0);
  }

  /**
   * Generates the vector grid based on a time/z-offset.
   */
  public generate(zOffset: number = 0) {
    this.grid = [];
    for (let x = 0; x < this.cols; x++) {
      this.grid[x] = [];
      for (let y = 0; y < this.rows; y++) {
        const nLarge = this.noiseGen.noise(x * this.scaleLarge, y * this.scaleLarge + zOffset);
        const nSmall = this.noiseGen.noise(x * this.scaleSmall, y * this.scaleSmall + zOffset * 1.3);
        const combined = (nLarge * 0.75 + nSmall * 0.25);
        const angle = combined * Math.PI * 4;
        this.grid[x][y] = Vector2D.fromAngle(angle);
      }
    }
  }

  /**
   * Retrieves a smoothed vector at any continuous world position.
   */
  public getVectorAt(x: number, y: number): Vector2D {
    const gx = (x - this.originX) / this.resolution;
    const gy = (y - this.originY) / this.resolution;

    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const x1 = x0 + 1;
    const y1 = y0 + 1;

    if (x0 < 0 || x1 >= this.cols || y0 < 0 || y1 >= this.rows) {
      return new Vector2D(0, 0);
    }

    const tx = gx - x0;
    const ty = gy - y0;

    const v00 = this.grid[x0][y0];
    const v10 = this.grid[x1][y0];
    const v01 = this.grid[x0][y1];
    const v11 = this.grid[x1][y1];

    const top = v00.mul(1 - tx).add(v10.mul(tx));
    const bottom = v01.mul(1 - tx).add(v11.mul(tx));

    const result = top.mul(1 - ty).add(bottom.mul(ty));
    return result.mag() > 0 ? result.normalize() : result;
  }
}