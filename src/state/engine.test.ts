import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  cleanup,
  isRunning,
  resetEngine,
  runLoop,
} from './engine';

beforeEach(() => {
  resetEngine();
  cleanup(); // ensure no leftover loop
});

describe('cleanup', () => {
  it('calls onResolve and stops the loop', () => {
    const onResolve = vi.fn();
    runLoop({ onTick: vi.fn(), onResolve, intervalMs: 100 });

    expect(isRunning()).toBe(true);

    cleanup();

    expect(onResolve).toHaveBeenCalledOnce();
    expect(isRunning()).toBe(false);
  });

  it('is a no-op when no loop is active', () => {
    // Should not throw or change state
    cleanup();
    expect(isRunning()).toBe(false);
  });

  it('stops a loop that has no onResolve', () => {
    runLoop({ onTick: vi.fn(), intervalMs: 100 });
    expect(isRunning()).toBe(true);

    cleanup();

    expect(isRunning()).toBe(false);
  });
});

describe('step transition contract', () => {
  it('cleanup before new runLoop prevents orphaned simulation', () => {
    // Arrange — simulate a running loop with resolve logic
    let resolved = false;
    runLoop({
      onTick: vi.fn(),
      onResolve: () => { resolved = true; },
      intervalMs: 100,
    });
    expect(isRunning()).toBe(true);

    // Act — cleanup then start a new loop (same as executeStep)
    cleanup();

    expect(resolved).toBe(true);
    expect(isRunning()).toBe(false);

    // Start a new loop
    const newTick = vi.fn();
    runLoop({ onTick: newTick, intervalMs: 100 });

    expect(isRunning()).toBe(true);
  });
});

describe('runLoop', () => {
  it('sets running to true', () => {
    expect(isRunning()).toBe(false);
    runLoop({ onTick: vi.fn(), intervalMs: 1000 });
    expect(isRunning()).toBe(true);
    cleanup(); // cleanup for test isolation
  });
});
