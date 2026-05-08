import type { GameState, NarratorParsedResponse } from "../types/game";
import { buildNarratorContext } from "./context";
import { parseNarratorResponse } from "./parser";
import { NARRATOR_SYSTEM_PROMPT } from "./prompt";

declare global {
  interface Window {
    claude?: {
      complete?: (input: { system: string; messages: Array<{ role: "user"; content: string }> }) => Promise<string | { content?: string }>;
    };
  }
}

export async function requestNarratorScene(
  state: GameState,
  action: string | { label?: string; text?: string; description?: string },
  systemPrompt = NARRATOR_SYSTEM_PROMPT,
): Promise<NarratorParsedResponse | null> {
  if (!window.claude?.complete) return null;

  const raw = await window.claude.complete({
    system: systemPrompt,
    messages: [{ role: "user", content: buildNarratorContext(state, action) }],
  });
  const text = typeof raw === "string" ? raw : raw.content ?? "";
  return parseNarratorResponse(text);
}
