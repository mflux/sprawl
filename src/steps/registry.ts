import type { StepDefinition } from './types';

import { step as landscape } from './landscape_gen';
import { step as infrastructure } from './infrastructure_gen';
import { step as urbanGrowth } from './urban_growth';
import { step as structural } from './structural_analysis';
import { step as subdivision } from './block_subdivision';
import { step as traffic } from './traffic_simulation';
import { step as naming } from './ai_naming';

/**
 * Ordered list of every simulation step.
 *
 * The rest of the codebase should use this array (and its indices)
 * instead of hardcoding step numbers or step-specific conditionals.
 */
export const STEPS: readonly StepDefinition[] = [
  landscape,       // 0
  infrastructure,  // 1
  urbanGrowth,     // 2
  structural,      // 3
  subdivision,     // 4
  traffic,         // 5
  naming,          // 6
] as const;

/** Total number of workflow steps. */
export const STEP_COUNT = STEPS.length;
