
import { addProfileLog } from '../state/engine';

/**
 * Utility to measure and record the execution time of a synchronous function.
 */
export const profile = <T>(name: string, fn: () => T): T => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;
  addProfileLog(name, duration);
  return result;
};
