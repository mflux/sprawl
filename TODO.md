# UrbanGenesis — Refactoring TODO

## High: Code Quality

### 6. `setInterval` Game Loops Instead of `requestAnimationFrame`

Multiple `setInterval` calls at 16ms drive the simulation, hub animation, subdivision, and traffic steps in `engine.ts`. `setInterval` doesn't sync with the browser's repaint cycle, can stack callbacks if a tick runs long, and wastes cycles when the tab is backgrounded.

**Fix:** Use `requestAnimationFrame` for anything that drives visual updates. Accumulate delta-time for simulation steps at a fixed timestep. For purely computational work, consider offloading to a web worker.

---

### 8. Large Canvas Component (~380 lines)

`GenerationCanvas/index.tsx` still contains the p5 sketch lifecycle, elevation baking dispatch, 6+ graphics buffer caches, mouse/touch/pinch handlers, zoom/pan transform, and the full render loop — all in one component.

**Fix:** Extract input handling (pan/zoom/pinch) into its own module. Consider extracting the bake-cache management (flow, shoreline, shapes, arterials, roads) into a dedicated hook or class.

---

### 10. `engine.ts` Is Large (~830 lines)

The engine absorbed all simulation logic from `useSimulation.ts` and orchestration from `GenerationView`. While this is architecturally correct (simulation lives outside React), the file itself covers spatial grids, ant physics, collision detection, road intersection, boundary clipping, wave management, phase loops, and public controls.

**Fix:** Extract ant simulation helpers (processAnt, checkCollisions, findRoadIntersection, etc.) into a separate `src/simulation/antPhysics.ts` module. Extract the spatial grid sync logic. Keep engine.ts focused on phase orchestration and state management.

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
- ~~~93 `any` types~~ — Typed all p5 parameters, created type augmentation for missing p5 v2 types, only 3 `any` remain in test/demo files
- ~~Global mutable state~~ — Migrated to Zustand (UI state with persist) + standalone Simulation Engine (mutable game state + phase orchestration). Deleted `store.ts` and `useSimulation.ts`. All components, steps, and canvas updated.
- ~~Duplicated hub resolution logic~~ — Consolidated into `engine.ts`
- ~~Monolithic `useSimulation` hook (406 lines)~~ — Absorbed into `engine.ts`
- ~~`GenerationView` orchestration (351 lines)~~ — Reduced to ~190 lines; loops moved to engine
- ~~Web worker as 100-line inline string~~ — Extracted to typed `elevation.worker.ts` with Vite native worker import, `useElevationWorkers` hook manages pool lifecycle. Canvas shrunk from 492 to 378 lines.
- ~~Confusing barrel files~~ — Replaced `GenerationView.tsx` / `GenerationCanvas.tsx` barrel files with standard `index.tsx` convention
