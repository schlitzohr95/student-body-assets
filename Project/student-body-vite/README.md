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

Run the local narrator proxy in a second terminal:

```bash
npm run narrator:proxy
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

In `http` mode, Beacon can also refresh a dropdown of currently free OpenRouter models from `http://127.0.0.1:8787/models/openrouter/free`. Selecting an option copies its model id into the request.

Beacon also includes a Test Bench. Pick a scenario preset, run the selected model, and it will score the response for usable narration, choices/open response, parseable `[STATE]`, event summary, witness ids, witness-boundary leaks, and patch size. Use **Run all** to compare the same model across every preset, then **Export Bench JSON** to save the comparison.

Beacon's **Generated scene mode** controls the normal dialogue strip:

- `Scripted scenes only`: default deterministic prototype behavior.
- `Generated next scene`: normal dialogue choices ask the narrator for the next scene.
- `Generated with scripted fallback`: same generated path, but rejected/failed responses fall back to the scripted scene.

For live testing, set provider to `http`, pick one of the stronger free models such as `baidu/cobuddy:free` or `qwen/qwen3-next-80b-a3b-instruct:free`, then choose `Generated with scripted fallback` and put the phone away.

You can run the same checks from the terminal:

```bash
npm run narrator:bench
```

Useful options:

```bash
npm run narrator:bench -- --limit=5
npm run narrator:bench -- --models=baidu/cobuddy:free,qwen/qwen3-next-80b-a3b-instruct:free
```

Reports are written to `bench-runs/`, which is gitignored because these files can get large and may include raw model output.

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

## Local Narrator Proxy

The proxy lives at `scripts/narrator-proxy.mjs` and listens on `http://127.0.0.1:8787/narrate` by default. It keeps API keys in Node environment variables, not in the browser.

It starts in `mock` mode if no provider env is set. For live calls, copy `.env.narrator.example` to `.env.narrator` or set environment variables in your terminal, then restart the proxy.

Supported providers:

- `mock`: local response, no key.
- `openai-compatible`: sends Chat Completions-style requests to `NARRATOR_BASE_URL` plus `/chat/completions`. This works for many hosted and local OpenAI-compatible gateways.
- `openrouter`: same request shape as `openai-compatible`, with OpenRouter-friendly headers.
- `anthropic`: sends Messages-style requests to `NARRATOR_BASE_URL` plus `/v1/messages`.
- `ollama`: sends local chat requests to `OLLAMA_HOST` plus `/api/chat`.

PowerShell examples:

```powershell
# OpenRouter
$env:NARRATOR_PROVIDER="openai-compatible"
$env:NARRATOR_BASE_URL="https://openrouter.ai/api/v1"
$env:NARRATOR_API_KEY="your-key"
npm run narrator:proxy
```

```powershell
# OpenAI-compatible gateway
$env:NARRATOR_PROVIDER="openai-compatible"
$env:NARRATOR_BASE_URL="https://your-provider.example/v1"
$env:NARRATOR_API_KEY="your-key"
$env:NARRATOR_MODEL="your-model"
npm run narrator:proxy
```

```powershell
# Local Ollama
$env:NARRATOR_PROVIDER="ollama"
$env:OLLAMA_HOST="http://127.0.0.1:11434"
$env:NARRATOR_MODEL="your-local-model"
npm run narrator:proxy
```

Beacon's `http` provider can stay pointed at `http://127.0.0.1:8787/narrate` while you swap providers behind the proxy.
