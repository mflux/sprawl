/**
 * Augments the p5 type definitions shipped with the p5 npm package.
 *
 * p5 v2's bundled types are missing touch event handlers and type
 * `touches` as `object[]`. This file provides the types needed to
 * work around those gaps.
 */

/** Touch point as exposed by p5 at runtime. */
interface P5Touch {
  x: number;
  y: number;
}

/**
 * p5 instance with touch event handler properties that exist at
 * runtime but are missing from the bundled p5 v2 type definitions.
 */
interface P5WithTouchEvents extends p5 {
  touchStarted?: ((event: TouchEvent) => boolean | void) | undefined;
  touchMoved?: ((event: TouchEvent) => boolean | void) | undefined;
  touchEnded?: ((event: TouchEvent) => boolean | void) | undefined;
}
