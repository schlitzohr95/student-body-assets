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

The main scene still uses scripted scenes by default. Beacon now opens a Narrator Lab for single-call generation tests against the same context assembler, parser, and state-patch code the real game loop will use.

Current non-LLM gameplay coverage:

- Location activities can change stats/resources and append to the event log.
- Pulse supports deterministic contact messaging once an NPC is known.
- Buzz shows a rotating campus feed plus the player's recent footprint.
- Anthrop shows a rules-based semester readout, suggestions, and relationship summary.
- Margin shows notes and recent event history.

See [docs/architecture.md](docs/architecture.md) for the folder map and where future work should land.

## Narrator Lab

Open the phone, tap Beacon, and run the mock provider first. The mock path never leaves the browser and is useful for checking context shape, parsing, and state-patch application.

Provider options:

- `mock`: deterministic local response for UI and parser testing.
- `window`: calls `window.studentBodyNarrator.complete(request)` if present, then falls back to the older `window.claude.complete({ system, messages })` shape.
- `http`: posts to a local/proxy endpoint such as `http://127.0.0.1:8787/narrate`.

HTTP request shape:

```json
{
  "system": "system prompt",
  "messages": [{ "role": "user", "content": "assembled scene context" }],
  "context": "assembled scene context",
  "action": "player action text",
  "model": "optional-model-name",
  "stateSummary": {
    "day": 1,
    "timeSlot": 32,
    "location": "coffee_shop",
    "presentNpcIds": ["mari"]
  }
}
```

The endpoint can return plain text, `{ "text": "..." }`, `{ "content": "..." }`, OpenAI-style `{ "choices": [{ "message": { "content": "..." } }] }`, or Anthropic-style `{ "content": [{ "type": "text", "text": "..." }] }`.
