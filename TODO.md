# UrbanGenesis — Refactoring TODO

## Critical: Architecture

### 1. Replace Global Mutable State with a Real State Manager

The entire app is driven by a single mutable plain object (`state` in `store.ts`) that is imported and directly mutated from components, hooks, and step functions. React has zero awareness of these changes. The only way the UI updates is a manual hack: incrementing a counter (`setTick(t => t + 1)`) to force re-renders.

This inverts React's entire model. You lose change detection, batched updates, concurrent rendering, dev tools support, and the ability to reason about when or why something re-rendered.

**Symptoms caused by this:**
- ~20 refs in `GenerationCanvas` exist solely to work around stale closures and manual change detection
- `triggerUpdate()` must be called manually after every mutation, and forgetting it causes silent bugs
- `resetState()` manually nulls every field — fragile and guaranteed to drift from the type definition
- Impossible to implement undo/redo, time-travel debugging, or snapshot testing

**Fix:** Migrate to Zustand (simplest path — supports mutable-style updates via Immer, selectors for render optimization, and works naturally with the existing code shape). Step functions should update state through the store rather than reaching into a global.

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

### 7. Duplicated Hub Resolution Logic

Hub processing (road snapping, distance-to-water calculation, terrain culling, shape detection) is implemented twice in `GenerationView`: once in `resolveHubs` (instant resolution) and once in the hub animation `useEffect` (animated one-at-a-time). Any change to one must be mirrored in the other.

**Fix:** Extract "process one hub" into a shared function. Have `resolveHubs` call it in a loop, and the animation interval call it per tick.

---

### 8. Monolithic Component Files

- `GenerationCanvas` (484 lines): Contains inline worker code, p5 sketch lifecycle, elevation baking, 6+ graphics buffer caches, mouse/touch/pinch handlers, zoom/pan transform, and the full render loop — all in one component.
- `GenerationView` (351 lines): Orchestrates a 7-step pipeline with complex state machine logic, 4 separate `useEffect`/`setInterval` loops, and multiple resolve/skip functions.
- `useSimulation` (406 lines): Mixes ant physics, road intersection detection, capsule collision, boundary clipping, wave management, and road network cleanup into one hook.

**Fix:** Separate rendering concerns (canvas, transform, input) from simulation concerns (physics, collisions, network). Extract the step orchestration into a dedicated state machine or workflow manager. Each draw/bake module is already in its own file — the component just needs to stop doing everything itself.

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
