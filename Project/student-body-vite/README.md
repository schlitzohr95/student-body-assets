# Student Body Vite Prototype

This is the TypeScript/React version of the current artifact prototype. It keeps the same gameplay spine but separates the parts that will grow independently:

- typed game state and deterministic state transitions
- static world data
- narrator context, parsing, and patch application
- browser/artifact persistence
- UI components and phone apps

Run it:

```bash
npm install
npm run dev
```

The first pass still uses scripted scenes by default. The narrator pipeline is present in `src/narrator`, so Phase 1.3 can wire live model calls into the same state/update loop without rewriting the UI.

Current non-LLM gameplay coverage:

- Location activities can change stats/resources and append to the event log.
- Pulse supports deterministic contact messaging once an NPC is known.
- Buzz shows a rotating campus feed plus the player's recent footprint.
- Anthrop shows a rules-based semester readout, suggestions, and relationship summary.
- Margin shows notes and recent event history.

See [docs/architecture.md](docs/architecture.md) for the folder map and where future work should land.
