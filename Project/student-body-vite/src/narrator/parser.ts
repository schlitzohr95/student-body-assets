import type { Choice, NarratorParsedResponse } from "../types/game";

export function choiceIdFromLabel(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/["']/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "choice"
  );
}

function parseNarratorChoiceLine(line: string, index: number): Choice | null {
  const cleaned = line.trim().replace(/^\d+[\).]\s*/, "").replace(/^[-*]\s*/, "");
  if (!cleaned) return null;

  if (cleaned.includes("|")) {
    const [label, id] = cleaned.split("|").map(part => part.trim());
    if (!label) return null;
    return { id: id || choiceIdFromLabel(label), label };
  }

  return { id: choiceIdFromLabel(cleaned) || `choice_${index + 1}`, label: cleaned };
}

function normalizeNarratorMarkers(text: string): string {
  return text
    .replace(/\*\*\s*\[(CHOICES|OPEN|STATE|\/CHOICES|\/STATE)\]\s*\*\*/gi, "[$1]")
    .replace(/__\s*\[(CHOICES|OPEN|STATE|\/CHOICES|\/STATE)\]\s*__/gi, "[$1]");
}

function cleanStateJson(rawJson: string): string {
  return rawJson
    .trim()
    .replace(/^```(?:json|js|javascript)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function parseNarratorResponse(text: string): NarratorParsedResponse {
  const rawText = normalizeNarratorMarkers(String(text || "").trim());
  const stateMatch = rawText.match(/\[STATE\]\s*([\s\S]*?)(?:\[\/STATE\]|$)/);
  let statePatch: Record<string, unknown> | null = null;
  let stateParseError: unknown | null = null;

  if (stateMatch) {
    try {
      statePatch = JSON.parse(cleanStateJson(stateMatch[1])) as Record<string, unknown>;
    } catch (error) {
      stateParseError = error;
    }
  }

  const choicesMatch = rawText.match(/\[CHOICES\]\s*([\s\S]*?)(?:\[\/CHOICES\]|\[OPEN\]|\[STATE\]|$)/);
  const choices = choicesMatch
    ? choicesMatch[1]
        .split("\n")
        .map((line, index) => parseNarratorChoiceLine(line, index))
        .filter(Boolean) as Choice[]
    : [];

  return {
    narration: rawText.split(/\[CHOICES\]|\[OPEN\]|\[STATE\]/)[0].trim(),
    choices,
    open: /\[OPEN\]/.test(rawText),
    statePatch,
    stateParseError,
  };
}
