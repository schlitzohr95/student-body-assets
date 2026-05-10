# Architecture Notes

This folder is intentionally split as if the project will become a real game, not a single artifact file.

## Folder Map

`src/types`
: Shared TypeScript contracts. If a concept crosses module boundaries, define its shape here first.

`src/data`
: Static authored data: locations, starter NPCs, phone app definitions, and asset paths. Generated world data can later be stored in game state, but these files remain the fallback baseline.

`src/engine`
: Deterministic game rules. Time advancement, event-log writes, navigation, choice effects, and scripted fallback scenes live here. These functions should not call the LLM or touch React state directly.

`src/narrator`
: LLM boundary. This owns scene-context assembly, provider-agnostic request adapters, response parsing, and state-patch application. It should stay testable without React and should not know about phone screens.

`src/services`
: Browser services and adapters. Persistence currently supports `localStorage` plus the artifact-style `window.storage` shape so the code can travel in either direction.

`src/ui`
: React presentation. Components can call engine functions through `App.tsx`, but should not mutate game state by hand.

`public/assets`
: Copied SVG assets from the repo root. In Vite these are normal static files instead of giant inline strings.

## State Flow

1. UI captures a player action.
2. `src/engine/transitions.ts` produces the next deterministic state.
3. Later, `src/narrator/client.ts` can call the model using `buildNarratorContext`.
4. `parseNarratorResponse` extracts prose, choices, and `[STATE]`.
5. `applyNarratorStatePatch` writes `event_summary` to the log and merges model-approved changes into state.
6. `src/services/storage.ts` persists the result.

## Narrator Boundary

`requestNarratorScene` accepts a provider config instead of a model-specific SDK. Current provider types are:

`mock`
: Local deterministic response. Use this to test UI wiring, parsing, and patch application.

`window`
: Browser bridge for artifact hosts or injected SDKs. It checks `window.studentBodyNarrator.complete(request)` first, then legacy `window.claude.complete({ system, messages })`.

`http`
: Local/proxy endpoint. Keep API keys out of the browser; this app only posts the already-assembled request and accepts common text response shapes.

Beacon's `NarratorLabApp` is the manual harness for trying one generation at a time. When the full game loop is ready, keep Beacon as a debug surface and call the same narrator functions from the normal choice/action flow.

`scripts/narrator-proxy.mjs` is the development proxy for the `http` provider. It is intentionally outside `src` because it runs in Node, owns provider secrets, and should never be bundled into the React app. It also exposes `GET /models/openrouter/free` for Beacon's free-model dropdown.

## What Goes Where

New stat mechanics
: `src/engine`, with type updates in `src/types`.

New NPC schema fields
: `src/types/game.ts`, then static examples in `src/data/npcs.ts`, and context formatting in `src/narrator/context.ts`.

New phone apps
: metadata in `src/data/apps.ts`, UI under `src/ui/apps`, routing in `App.tsx`.

Narrator prompt changes
: `src/narrator/prompt.ts`. Context shape changes belong in `src/narrator/context.ts`.

Storage/database changes
: Start in `src/services/storage.ts`; do not leak persistence details into components.
