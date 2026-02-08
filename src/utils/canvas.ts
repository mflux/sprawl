import p5 from 'p5';

/**
 * Returns the current canvas transform scale.
 * Assumes Canvas2D mode (this codebase never uses WebGL).
 */
export function getCanvasScale(p: p5): number {
  return (p.drawingContext as CanvasRenderingContext2D).getTransform().a;
}
