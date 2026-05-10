import type { GameState, NarratorParsedResponse } from "../types/game";
import { buildNarratorContext } from "./context";
import { parseNarratorResponse } from "./parser";
import { NARRATOR_SYSTEM_PROMPT } from "./prompt";

type NarratorAction = string | { label?: string; text?: string; description?: string };
type ChatMessage = { role: "user"; content: string };
type ProviderResponse = string | Record<string, unknown>;

export type NarratorProviderType = "mock" | "window" | "http";

export interface NarratorProviderConfig {
  type: NarratorProviderType;
  endpoint?: string;
  model?: string;
  timeoutMs?: number;
}

export interface NarratorProviderRequest {
  system: string;
  messages: ChatMessage[];
  context: string;
  action: string;
  model?: string;
  stateSummary: {
    day: number;
    timeSlot: number;
    location: string;
    presentNpcIds: string[];
  };
}

export interface NarratorRunResult {
  provider: NarratorProviderConfig;
  request: NarratorProviderRequest;
  context: string;
  rawText: string;
  parsed: NarratorParsedResponse;
  latencyMs: number;
}

export interface NarratorRequestOptions {
  provider?: NarratorProviderConfig;
  systemPrompt?: string;
}

export interface NarratorContextRequestInput {
  context: string;
  action: string;
  stateSummary: NarratorProviderRequest["stateSummary"];
}

declare global {
  interface Window {
    studentBodyNarrator?: {
      complete?: (input: NarratorProviderRequest) => Promise<ProviderResponse>;
    };
    claude?: {
      complete?: (input: { system: string; messages: ChatMessage[] }) => Promise<ProviderResponse>;
    };
  }
}

const DEFAULT_PROVIDER: NarratorProviderConfig = { type: "mock" };

function actionToText(action: NarratorAction): string {
  if (typeof action === "string") return action;
  return action.text || action.description || action.label || "[arrived at location]";
}

function presentNpcIds(state: GameState): string[] {
  const ids = state.presentNpcIds || state.scene?.presentNpcIds || state.currentScene?.presentNpcIds || [];
  if (ids.length) return ids;

  const present = state.presentNpcs || state.scene?.npcsPresent || state.currentScene?.npcsPresent || [];
  const explicitPresent = present.map(npc => (typeof npc === "string" ? npc : npc.id)).filter(Boolean);
  if (explicitPresent.length) return explicitPresent;

  if (state.location === "coffee_shop") return ["studious"];
  if (state.location === "dorm_room" && state.introSeen) return ["roommate"];
  return [];
}

function textFromContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map(part => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") return part.text;
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function extractProviderText(response: ProviderResponse): string {
  if (typeof response === "string") return response;

  const directText = textFromContent(response.text) || textFromContent(response.content) || textFromContent(response.output_text);
  if (directText) return directText;

  const choices = response.choices;
  if (Array.isArray(choices)) {
    const first = choices[0];
    if (first && typeof first === "object") {
      const record = first as Record<string, unknown>;
      if (record.message && typeof record.message === "object") {
        const message = record.message as Record<string, unknown>;
        const messageText = textFromContent(message.content);
        if (messageText) return messageText;
      }
      const choiceText = textFromContent(record.text);
      if (choiceText) return choiceText;
    }
  }

  return "";
}

function mockNarratorResponse(request: NarratorProviderRequest): string {
  const action = request.action || "[arrived at location]";
  const statePatch = JSON.stringify({
    event_summary: `Narrator Lab generated a single-call continuation for: ${action}`,
    witnesses: request.stateSummary.presentNpcIds,
    flags: {
      last_narrator_provider: "mock",
    },
  }, null, 2);

  return `The scene answers from the context it was given, keeping the thread narrow instead of assuming a hidden transcript. The last move was: ${action}

The response stays grounded in the current place, the visible relationships, and the filtered event log. If an NPC is present, they react to what they could reasonably know; if nobody is present, the moment leans on mood, location, and the player's current pressure.

[CHOICES]
Ask a careful follow-up
Share one specific detail
Let the silence work
[STATE]
${statePatch}`;
}

async function runWindowProvider(request: NarratorProviderRequest): Promise<string> {
  if (typeof window === "undefined") throw new Error("Window provider is only available in the browser.");

  if (window.studentBodyNarrator?.complete) {
    return extractProviderText(await window.studentBodyNarrator.complete(request));
  }

  if (window.claude?.complete) {
    return extractProviderText(await window.claude.complete({ system: request.system, messages: request.messages }));
  }

  throw new Error("No window narrator bridge found. Expected window.studentBodyNarrator.complete or window.claude.complete.");
}

async function runHttpProvider(request: NarratorProviderRequest, provider: NarratorProviderConfig): Promise<string> {
  if (!provider.endpoint) throw new Error("HTTP provider needs an endpoint.");

  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), provider.timeoutMs || 45000);

  try {
    const response = await fetch(provider.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`HTTP narrator returned ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : await response.text();
    return extractProviderText(payload);
  } finally {
    globalThis.clearTimeout(timer);
  }
}

export async function requestNarratorScene(
  state: GameState,
  action: NarratorAction,
  options: NarratorRequestOptions = {},
): Promise<NarratorRunResult> {
  const actionText = actionToText(action);
  return requestNarratorContext({
    context: buildNarratorContext(state, actionText),
    action: actionText,
    stateSummary: {
      day: state.day,
      timeSlot: state.timeSlot,
      location: state.location,
      presentNpcIds: presentNpcIds(state),
    },
  }, options);
}

export async function requestNarratorContext(
  input: NarratorContextRequestInput,
  options: NarratorRequestOptions = {},
): Promise<NarratorRunResult> {
  const provider = options.provider || DEFAULT_PROVIDER;
  const request: NarratorProviderRequest = {
    system: options.systemPrompt || NARRATOR_SYSTEM_PROMPT,
    messages: [{ role: "user", content: input.context }],
    context: input.context,
    action: input.action,
    model: provider.model,
    stateSummary: input.stateSummary,
  };
  const started = performance.now();
  let rawText = "";

  if (provider.type === "mock") rawText = mockNarratorResponse(request);
  else if (provider.type === "window") rawText = await runWindowProvider(request);
  else rawText = await runHttpProvider(request, provider);

  return {
    provider,
    request,
    context: input.context,
    rawText,
    parsed: parseNarratorResponse(rawText),
    latencyMs: Math.round(performance.now() - started),
  };
}
