import { describe, it, expect, beforeEach } from 'vitest';
import engine, {
  state,
  cleanupCurrentPhase,
  setPhase,
  getPhase,
  isRunning,
  resetEngine,
} from './engine';
import { Hub } from '../modules/Hub';
import { Vector2D } from '../modules/Vector2D';

beforeEach(() => {
  resetEngine();
});

describe('cleanupCurrentPhase', () => {
  it('resolves hub_animation: drains hubQueue into hubs', () => {
    // Arrange — queue up 3 hubs and start the hub_animation phase
    const h1 = new Hub(new Vector2D(100, 100), 30, 1);
    const h2 = new Hub(new Vector2D(300, 300), 25, 2);
    const h3 = new Hub(new Vector2D(500, 500), 20, 3);
    // Give each hub a minimal shape so RoadNetwork.addSegmentSnapped has points
    for (const h of [h1, h2, h3]) {
      h.shapePoints = [
        h.position.add(new Vector2D(10, 0)),
        h.position.add(new Vector2D(0, 10)),
        h.position.add(new Vector2D(-10, 0)),
      ];
    }
    state.hubQueue = [h1, h2, h3];
    setPhase('hub_animation', true);

    expect(state.hubQueue.length).toBe(3);
    expect(state.hubs.length).toBe(0);
    expect(isRunning()).toBe(true);

    // Act — simulate stepping to the next workflow step
    cleanupCurrentPhase();

    // Assert — all queued hubs are now placed, engine stopped
    expect(state.hubQueue.length).toBe(0);
    expect(state.hubs.length).toBe(3);
    expect(isRunning()).toBe(false);
  });

  it('is a no-op when engine is idle', () => {
    setPhase('idle');

    // Should not throw or change state
    cleanupCurrentPhase();

    expect(getPhase()).toBe('idle');
    expect(isRunning()).toBe(false);
  });

  it('stops the engine running flag for any active phase', () => {
    // Use traffic as an example — with no roads/hubs the resolve is
    // effectively a no-op, but _running should still be cleared
    setPhase('traffic', true);
    expect(isRunning()).toBe(true);

    cleanupCurrentPhase();

    expect(isRunning()).toBe(false);
  });
});

describe('step transition contract', () => {
  it('cleanupCurrentPhase before new step prevents orphaned simulation', () => {
    // Arrange — simulate mid-hub-animation with remaining work
    const h1 = new Hub(new Vector2D(200, 200), 40, 1);
    h1.shapePoints = [
      h1.position.add(new Vector2D(15, 0)),
      h1.position.add(new Vector2D(0, 15)),
      h1.position.add(new Vector2D(-15, 0)),
    ];
    state.hubQueue = [h1];
    setPhase('hub_animation', true);

    // Verify we're mid-simulation
    expect(state.hubQueue.length).toBe(1);
    expect(isRunning()).toBe(true);

    // Act — same sequence executeStep now performs:
    // 1. cleanup previous phase
    cleanupCurrentPhase();
    // 2. start new phase (e.g., ant_simulation setup)
    setPhase('ant_simulation', true);

    // Assert — hub from old phase was resolved
    expect(state.hubQueue.length).toBe(0);
    expect(state.hubs.length).toBe(1);
    // New phase is active
    expect(getPhase()).toBe('ant_simulation');
    expect(isRunning()).toBe(true);
  });
});
