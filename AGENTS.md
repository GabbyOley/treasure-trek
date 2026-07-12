# Treasure Trek

A browser board game. TypeScript + Three.js + Vite. Static deploy to Vercel.
Play against the computer, or against another person using a shared game code.

## Setup
- `npm install` — install
- `npm run dev` — local dev
- `npm run build` — production build (REQUIRED CI check, must pass)
- `npm test` — unit tests (vitest)

## ★ THE LOAD-BEARING RULE — purity split

`src/game/` is PURE TypeScript. It has:
- ZERO `three` imports
- ZERO DOM access (no `window`, `document`, `localStorage`)
- ZERO framework code

It must be testable in plain Node with no browser and no WebGL context.
Anything that touches `three` lives in `src/rendering/`.
Renderers READ game state. Renderers NEVER mutate game state.

This is not a style preference. It is what makes three things possible at once:
1. The rules can be unit-tested without rendering anything.
2. The computer opponent is just a pure function: `chooseMove(state) -> Move`.
3. Two-player-by-code works by sending a `Move` over the wire and applying the
   SAME pure reducer on both machines. No duplicated rules, no desync.

If the rules leak into rendering code, all three of those break and the game
has to be rebuilt. Do not let it happen.

## Layout

src/
  game/           PURE. Rules, state, reducer, AI. Zero three, zero DOM.
    __tests__/    vitest specs for the pure layer
  input/          DOM listeners (click/touch) -> pure intent objects
  rendering/      Three.js: SceneManager, board, pieces, HUD
  audio/          synthesized audio (no audio files)
  net/            multiplayer transport (game-code rooms). Sends/receives Moves.
  state/          localStorage wrapper (Safari-private-safe)
  utils/
    constants.ts  ALL tuning values live here
    math.ts
  main.ts         fixed-timestep loop: input -> update -> render

## Rules

- Game state is ONE object. The reducer returns NEW state. Never mutate.
- A turn is a `Move`. `applyMove(state, move) -> state`. Pure. Deterministic.
  Same state + same move = same result, on every machine.
- Randomness (dice) must come from a SEEDED RNG carried in game state. Never
  call `Math.random()` in `src/game/` — it desyncs two-player games.
- No magic numbers. Board size, dice sides, spaces, treasure values, AI
  difficulty -> `src/utils/constants.ts`.
- Two palettes in constants.ts: `PALETTE` (0xRRGGBB, for three.js) and
  `CSS_PALETTE` (#rrggbb, for HTML/HUD).
- Procedural only. No image files, no 3D model files, no audio files.
- Must work on a phone. Touch targets 44px minimum. Test at 375px wide.
- No `any` types.

## Review guidelines

- Flag ANY `three` import or DOM access inside `src/game/` as P0.
- Flag any state mutation instead of returning new state as P0.
- Flag `Math.random()` or `Date.now()` inside `src/game/` as P0 — it breaks
  two-player sync.
- Flag anything that breaks `npm run build` as P0.
- Flag magic numbers outside `constants.ts` as P1.
- Flag touch targets under 44px as P1.
- Flag missing aria-labels on interactive elements as P1.
- Keep reviews short and in plain English. This repo is maintained by a
  beginner — explain what is wrong and WHY it matters, not just what to change.

## Branch workflow

- Every change starts from a NEW branch created from `main`.
- Open a PR for that branch.
- Merge the PR before starting the next task.
- Delete the branch after it is merged.
- Do not stack unrelated work on an older branch.
