# UrbanGenesis — Refactoring TODO

## Critical: Architecture

### ~~1. Replace Global Mutable State with a Real State Manager~~ — DONE

Migrated to a split architecture: **Zustand** for UI/settings state (`uiStore.ts` with persist middleware) and a standalone **Simulation Engine** (`engine.ts`) for mutable game state and orchestration loops. The engine owns all simulation state, phase control (start/pause/step/resolve), and a subscriber pattern that bumps a Zustand tick counter to trigger React re-renders. Settings auto-sync from Zustand → Engine via a bridge module. Deleted the old `store.ts` and `useSimulation.ts`. All 7 step files, all UI components, and the canvas now import from engine/uiStore.

---

## Critical: Dependencies & Build

### 2. ~93 `any` Types Remaining

The codebase still has ~93 `@typescript-eslint/no-explicit-any` warnings, mostly in the canvas rendering layer (draw/bake functions that accept p5 instances as `any`). These prevent full type safety.

**Fix:** Type the p5 graphics parameters using the `@types/p5` definitions already installed. Consider a thin typed wrapper for the canvas drawing API surface.

---

## High: Code Quality

### 5. Web Worker Code as a 100-Line Inline String

The elevation baking worker in `GenerationCanvas` is a ~100-line JavaScript string assigned to a constant. It contains a full Perlin noise implementation and terrain renderer. This string cannot be linted, type-checked, or debugged with source maps. It also duplicates the `SimpleNoise` class that already exists in `FlowField.ts`.

**Fix:** Move the worker to a separate `.ts` file and use Vite's built-in worker support: `new Worker(new URL('./elevation.worker.ts', import.meta.url), { type: 'module' })`.

---

### 6. `setInterval` Game Loops Instead of `requestAnimationFrame`

Multiple `setInterval` calls at 16ms drive the simulation, hub animation, subdivision, and traffic steps. `setInterval` doesn't sync with the browser's repaint cycle, can stack callbacks if a tick runs long, and wastes cycles when the tab is backgrounded.

**Fix:** Use `requestAnimationFrame` for anything that drives visual updates. Accumulate delta-time for simulation steps at a fixed timestep. For purely computational work, consider offloading to a web worker.

---

### ~~7. Duplicated Hub Resolution Logic~~ — DONE

Hub processing logic now lives in the engine in a single place. `resolveHubs()` and `startHubAnimationLoop()` both share the same state manipulation code in `engine.ts`.

---

### 8. Monolithic Component Files

- `GenerationCanvas` (484 lines): Contains inline worker code, p5 sketch lifecycle, elevation baking, 6+ graphics buffer caches, mouse/touch/pinch handlers, zoom/pan transform, and the full render loop — all in one component.
- ~~`GenerationView` (351 lines)~~ — Reduced to ~170 lines; orchestration moved to `engine.ts`
- ~~`useSimulation` (406 lines)~~ — Deleted; ant physics, collisions, wave management absorbed into `engine.ts`

**Remaining:** `GenerationCanvas` is still large (~480 lines) due to inline worker code and p5 lifecycle. Extract the worker to a separate file (see #5) and the canvas will shrink further.

---

## Medium: Project Hygiene

### 9. API Key Baked into Client Bundle

Vite's `define` config injects `GEMINI_API_KEY` as a string literal into the built JavaScript. Anyone can view-source and extract it. The AI naming step calls the Gemini API directly from the browser with this key.

**Fix:** If this is a local-only tool, document that clearly and add `.env.local` to `.gitignore` (already done). If it will ever be deployed publicly, the naming step needs a backend proxy.

---

## Completed

- ~~Broken / phantom imports~~ — Fixed `Shape2D` path, removed phantom `Building` type and dead registry imports
- ~~Import maps conflicting with Vite~~ — Removed `<script type="importmap">` from `index.html`
- ~~No test runner~~ — Installed Vitest, rewrote all 30 test files (135 tests) to native `describe`/`it`/`expect`
- ~~No `src/` directory~~ — Moved all source into `src/`, updated path alias and entry point
- ~~Dead `index.css` reference~~ — Removed from `index.html`
- ~~p5.js as untyped CDN global~~ — Installed `p5` + `@types/p5` from npm, replaced `declare const p5: any` with proper import
- ~~Tailwind CSS via runtime CDN~~ — Installed `tailwindcss` + `@tailwindcss/vite`, purged 42 KB build output replaces full CDN runtime
- ~~No linter, no strict TypeScript~~ — Enabled `strict: true` in tsconfig, installed ESLint 9 with typescript-eslint + react-hooks plugins, added `lint`/`typecheck` scripts, fixed 35 strict-mode errors
- ~~Global mutable state~~ — Migrated to Zustand (UI state with persist) + standalone Simulation Engine (mutable game state + phase orchestration). Deleted `store.ts` and `useSimulation.ts`. All components, steps, and canvas updated.
- ~~Duplicated hub resolution logic~~ — Consolidated into `engine.ts`
- ~~Monolithic `useSimulation` hook (406 lines)~~ — Absorbed into `engine.ts`
- ~~`GenerationView` orchestration (351 lines)~~ — Reduced to ~170 lines; loops moved to engine
