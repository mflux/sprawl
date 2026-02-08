import { VisualizationSettings } from '../types';
import { EnginePhase } from '../state/engineTypes';

/**
 * Defines everything about a simulation workflow step.
 *
 * Each step module exports one of these. The rest of the codebase
 * consumes step definitions via the registry — no hardcoded step
 * numbers or step-specific conditionals anywhere else.
 */
export interface StepDefinition {
  /** Unique identifier, e.g. 'landscape', 'infrastructure'. */
  id: string;

  /** Short label for the workflow dock button, e.g. 'Geo', 'Hubs'. */
  label: string;

  /** Tooltip title. */
  title: string;

  /** Tooltip description. */
  desc: string;

  /** Visualization settings to apply when this step starts. */
  vizTransitions: Partial<VisualizationSettings>;

  // ── Runtime behavior ────────────────────────────────────────────

  /** Which engine loop type this step uses. 'idle' for synchronous steps. */
  phase: EnginePhase;

  /** Override simSpeed when this step starts. Undefined = no change. */
  initialSimSpeed?: number;

  /** Whether to show play/pause/step/resolve controls during this step. */
  hasSimControls: boolean;

  /** When revisited, this step acts as a full reset (step 1 behavior). */
  canReset?: boolean;

  /** Use high-resolution (1.5x) elevation baking instead of 3.0x. */
  highResElevation?: boolean;

  /** Force full road network rebake every frame. */
  forceRoadBake?: boolean;

  // ── Functions ───────────────────────────────────────────────────

  /** Set up and start this step. May be async (e.g. AI naming). */
  execute: () => Promise<void> | void;

  /** Returns true when this step has finished its work. */
  isComplete: () => boolean;
}
