/** Distinct loop types the engine can run. */
export type EnginePhase =
  | 'idle'
  | 'landscape'
  | 'hub_animation'
  | 'ant_simulation'
  | 'subdivision'
  | 'traffic'
  | 'naming';
