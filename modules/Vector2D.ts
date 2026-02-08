
export class Vector2D {
  constructor(public x: number = 0, public y: number = 0) {}

  add(other: Vector2D): Vector2D {
    return new Vector2D(this.x + other.x, this.y + other.y);
  }

  sub(other: Vector2D): Vector2D {
    return new Vector2D(this.x - other.x, this.y - other.y);
  }

  mul(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  div(scalar: number): Vector2D {
    if (scalar === 0) return new Vector2D(0, 0);
    return new Vector2D(this.x / scalar, this.y / scalar);
  }

  mag(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): Vector2D {
    const m = this.mag();
    if (m === 0) return new Vector2D(0, 0);
    return this.div(m);
  }

  dot(other: Vector2D): number {
    return this.x * other.x + this.y * other.y;
  }

  dist(other: Vector2D): number {
    return this.sub(other).mag();
  }

  copy(): Vector2D {
    return new Vector2D(this.x, this.y);
  }

  equals(other: Vector2D, epsilon: number = 0.0001): boolean {
    return Math.abs(this.x - other.x) < epsilon && Math.abs(this.y - other.y) < epsilon;
  }

  static fromAngle(angle: number, length: number = 1): Vector2D {
    return new Vector2D(Math.cos(angle) * length, Math.sin(angle) * length);
  }
}
