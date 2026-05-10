import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const DEFAULT_PORT = 8787;
const MAX_BODY_BYTES = 1_000_000;
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const FREE_PRICE_FIELDS = [
  "prompt",
  "completion",
  "image",
  "request",
  "web_search",
  "internal_reasoning",
  "input_cache_read",
  "input_cache_write",
];

loadEnvFile(join(ROOT_DIR, ".env.local"));
loadEnvFile(join(ROOT_DIR, ".env.narrator"));

const env = process.env;
const host = env.NARRATOR_HOST || "127.0.0.1";
const port = Number(env.NARRATOR_PORT || DEFAULT_PORT);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;

  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalsAt = line.indexOf("=");
    if (equalsAt === -1) continue;

    const key = line.slice(0, equalsAt).trim();
    let value = line.slice(equalsAt + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function providerName() {
  const explicit = env.NARRATOR_PROVIDER?.toLowerCase();
  if (explicit) return explicit;
  if (env.ANTHROPIC_API_KEY) return "anthropic";
  if (env.OLLAMA_HOST) return "ollama";
  if (env.NARRATOR_API_KEY || env.OPENAI_API_KEY) return "openai-compatible";
  return "mock";
}

function modelFor(request) {
  return env.NARRATOR_MODEL || request.model;
}

function numberEnv(name, fallback) {
  const parsed = Number(env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hasOpenRouterBaseUrl() {
  return trimTrailingSlash(env.NARRATOR_BASE_URL || "").includes("openrouter.ai");
}

function addOpenRouterHeaders(headers) {
  if (!hasOpenRouterBaseUrl() && providerName() !== "openrouter") return headers;
  return {
    ...headers,
    "HTTP-Referer": env.OPENROUTER_SITE_URL || "http://127.0.0.1:5174",
    "X-Title": env.OPENROUTER_APP_TITLE || "Student Body Local Prototype",
  };
}

function corsOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return "*";

  try {
    const parsed = new URL(origin);
    const isLocalHost = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
    if (isLocalHost) return origin;
  } catch {
    return env.NARRATOR_ALLOWED_ORIGIN || "http://127.0.0.1:5174";
  }

  return env.NARRATOR_ALLOWED_ORIGIN || "http://127.0.0.1:5174";
}

function sendJson(req, res, status, payload) {
  res.writeHead(status, {
    "Access-Control-Allow-Origin": corsOrigin(req),
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(payload, null, 2));
}

async function readJson(req) {
  let size = 0;
  const chunks = [];

  for await (const chunk of req) {
    size += chunk.byteLength;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, "Request body is too large.");
    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString("utf8");
  if (!text.trim()) throw new HttpError(400, "Request body must be JSON.");

  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Request body is not valid JSON.");
  }
}

function assertNarratorRequest(request) {
  if (!request || typeof request !== "object") throw new HttpError(400, "Missing narrator request.");
  if (typeof request.system !== "string") throw new HttpError(400, "Missing system prompt.");
  if (!Array.isArray(request.messages)) throw new HttpError(400, "Missing messages array.");
}

function chatMessages(request) {
  return [
    { role: "system", content: request.system },
    ...request.messages.map(message => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: String(message.content || ""),
    })),
  ];
}

function textFromContent(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map(part => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && typeof part.text === "string") return part.text;
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function extractText(payload) {
  if (typeof payload === "string") return payload;
  if (!payload || typeof payload !== "object") return "";

  const direct = textFromContent(payload.text) || textFromContent(payload.content) || textFromContent(payload.output_text);
  if (direct) return direct;

  if (payload.message && typeof payload.message === "object") {
    const messageText = textFromContent(payload.message.content);
    if (messageText) return messageText;
  }

  if (Array.isArray(payload.choices)) {
    const first = payload.choices[0];
    if (first && typeof first === "object") {
      if (first.message && typeof first.message === "object") {
        const messageText = textFromContent(first.message.content);
        if (messageText) return messageText;
      }
      const choiceText = textFromContent(first.text);
      if (choiceText) return choiceText;
    }
  }

  if (typeof payload.response === "string") return payload.response;
  return "";
}

function priceNumber(value) {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function isFreeOpenRouterModel(model) {
  if (!model || typeof model !== "object" || typeof model.id !== "string") return false;
  if (model.id.endsWith(":free")) return true;

  const pricing = model.pricing && typeof model.pricing === "object" ? model.pricing : {};
  const prices = FREE_PRICE_FIELDS
    .map(field => priceNumber(pricing[field]))
    .filter(value => value !== null);

  return prices.length > 0 && prices.every(value => value === 0);
}

function normalizeOpenRouterModel(model) {
  return {
    id: model.id,
    name: model.name || model.id,
    description: model.description || "",
    contextLength: model.context_length || model.contextLength || null,
    architecture: model.architecture || null,
    pricing: model.pricing || {},
  };
}

async function fetchOpenRouterFreeModels() {
  const headers = addOpenRouterHeaders({ "Content-Type": "application/json" });
  const apiKey = env.NARRATOR_API_KEY || env.OPENAI_API_KEY || env.OPENROUTER_API_KEY;
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const payload = await fetchJson(env.OPENROUTER_MODELS_URL || OPENROUTER_MODELS_URL, {
    method: "GET",
    headers,
  });

  const models = Array.isArray(payload.data) ? payload.data : [];
  return models
    .filter(isFreeOpenRouterModel)
    .map(normalizeOpenRouterModel)
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const raw = await response.text();
  let payload = raw;

  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = raw;
  }

  if (!response.ok) {
    const providerMessage = payload?.error?.message || payload?.error || payload?.message || raw || response.statusText;
    throw new HttpError(response.status, `Provider error: ${providerMessage}`);
  }

  return payload;
}

function mockText(request) {
  const action = request.action || "[arrived at location]";
  const witnesses = request.stateSummary?.presentNpcIds || [];
  return `The proxy is running in mock mode, so this response proves the browser can reach the local narrator boundary without exposing a key. The player action was: ${action}

This is the same response contract a live provider should satisfy: narration first, then choices, then a state patch.

[CHOICES]
Press for a little more detail
Change the subject gently
Let the moment breathe
[STATE]
${JSON.stringify({
    event_summary: `Proxy mock generated a single-call continuation for: ${action}`,
    witnesses,
    flags: { last_narrator_proxy_provider: "mock" },
  }, null, 2)}`;
}

async function callOpenAiCompatible(request, provider) {
  const model = modelFor(request);
  if (!model) throw new HttpError(400, "Set NARRATOR_MODEL or provide a model from Beacon.");

  const apiKey = env.NARRATOR_API_KEY || env.OPENAI_API_KEY;
  const baseUrl = trimTrailingSlash(env.NARRATOR_BASE_URL || "https://api.openai.com/v1");
  const url = env.NARRATOR_CHAT_URL || `${baseUrl}/chat/completions`;
  let headers = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  headers = addOpenRouterHeaders(headers);

  const payload = await fetchJson(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: chatMessages(request),
      temperature: numberEnv("NARRATOR_TEMPERATURE", 0.8),
      max_tokens: numberEnv("NARRATOR_MAX_TOKENS", 900),
    }),
  });

  return { provider, model, text: extractText(payload) };
}

async function callAnthropic(request) {
  const model = modelFor(request);
  if (!model) throw new HttpError(400, "Set NARRATOR_MODEL or provide a model from Beacon.");

  const apiKey = env.NARRATOR_API_KEY || env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new HttpError(400, "Set ANTHROPIC_API_KEY or NARRATOR_API_KEY.");

  const url = env.NARRATOR_CHAT_URL || `${trimTrailingSlash(env.NARRATOR_BASE_URL || "https://api.anthropic.com")}/v1/messages`;
  const payload = await fetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": env.ANTHROPIC_VERSION || "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: request.system,
      messages: request.messages.map(message => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: String(message.content || ""),
      })),
      temperature: numberEnv("NARRATOR_TEMPERATURE", 0.8),
      max_tokens: numberEnv("NARRATOR_MAX_TOKENS", 900),
    }),
  });

  return { provider: "anthropic", model, text: extractText(payload) };
}

async function callOllama(request) {
  const model = modelFor(request);
  if (!model) throw new HttpError(400, "Set NARRATOR_MODEL or provide a model from Beacon.");

  const baseUrl = trimTrailingSlash(env.OLLAMA_HOST || env.NARRATOR_BASE_URL || "http://127.0.0.1:11434");
  const payload = await fetchJson(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: chatMessages(request),
      options: {
        temperature: numberEnv("NARRATOR_TEMPERATURE", 0.8),
      },
    }),
  });

  return { provider: "ollama", model, text: extractText(payload) };
}

async function narrate(request) {
  assertNarratorRequest(request);

  const provider = providerName();
  if (provider === "mock") return { provider, model: "mock", text: mockText(request) };
  if (provider === "anthropic") return callAnthropic(request);
  if (provider === "ollama") return callOllama(request);
  if (provider === "openai" || provider === "openrouter" || provider === "openai-compatible") return callOpenAiCompatible(request, provider);

  throw new HttpError(400, `Unknown NARRATOR_PROVIDER "${provider}".`);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      sendJson(req, res, 204, {});
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || `${host}:${port}`}`);

    if (req.method === "GET" && url.pathname === "/health") {
      sendJson(req, res, 200, { ok: true, provider: providerName(), port });
      return;
    }

    if (req.method === "GET" && url.pathname === "/models/openrouter/free") {
      const models = await fetchOpenRouterFreeModels();
      sendJson(req, res, 200, {
        provider: "openrouter",
        fetchedAt: new Date().toISOString(),
        count: models.length,
        models,
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/narrate") {
      const request = await readJson(req);
      const response = await narrate(request);
      if (!response.text) throw new HttpError(502, "Provider returned no text.");
      sendJson(req, res, 200, response);
      return;
    }

    sendJson(req, res, 404, { error: "Not found. Use POST /narrate, GET /models/openrouter/free, or GET /health." });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    sendJson(req, res, status, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, host, () => {
  console.log(`Narrator proxy listening at http://${host}:${port}/narrate (${providerName()})`);
});
