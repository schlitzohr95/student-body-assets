import type { NarratorRunResult } from "./client";

export interface NarratorValidationFlag {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface NarratorValidationResult {
  ok: boolean;
  flags: NarratorValidationFlag[];
  summary: string;
}

function witnessIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return String(record.id || record.key || record.name || "");
      }
      return "";
    })
    .filter(Boolean);
}

function eventSummaryFromPatch(patch: Record<string, unknown> | null): string {
  if (!patch) return "";
  return typeof patch.event_summary === "string"
    ? patch.event_summary
    : typeof patch.eventSummary === "string"
      ? patch.eventSummary
      : "";
}

export function validateGeneratedScene(run: NarratorRunResult): NarratorValidationResult {
  const patch = run.parsed.statePatch;
  const eventSummary = eventSummaryFromPatch(patch);
  const witnesses = patch ? witnessIds(patch.witnesses || patch.witness_ids || patch.witnessIds) : [];
  const expectedWitnesses = run.request.stateSummary.presentNpcIds || [];
  const stateText = patch ? JSON.stringify(patch) : "";

  const flags: NarratorValidationFlag[] = [
    {
      id: "narration",
      label: "Narration",
      passed: run.parsed.narration.trim().length >= 60,
      detail: run.parsed.narration.trim().length >= 60 ? "Usable narration." : "Narration is missing or too thin.",
    },
    {
      id: "choices",
      label: "Choices",
      passed: run.parsed.choices.length >= 2 && run.parsed.choices.length <= 4,
      detail: `${run.parsed.choices.length} parsed choice(s).`,
    },
    {
      id: "state",
      label: "State JSON",
      passed: Boolean(patch) && !run.parsed.stateParseError,
      detail: patch && !run.parsed.stateParseError ? "State patch parsed." : "Missing or invalid [STATE].",
    },
    {
      id: "event-summary",
      label: "Event Summary",
      passed: eventSummary.trim().length >= 10,
      detail: eventSummary.trim() || "No event_summary.",
    },
    {
      id: "witnesses",
      label: "Witnesses",
      passed: !expectedWitnesses.length || expectedWitnesses.every(id => witnesses.includes(id)),
      detail: expectedWitnesses.length ? (witnesses.join(", ") || "No witnesses.") : "No expected NPC witnesses.",
    },
    {
      id: "patch-size",
      label: "Patch Size",
      passed: stateText.length <= 1800,
      detail: `${stateText.length} JSON chars.`,
    },
  ];
  const failures = flags.filter(flag => !flag.passed);
  return {
    ok: failures.length === 0,
    flags,
    summary: failures.length ? failures.map(flag => flag.label).join(", ") : "Passed generated-scene validation.",
  };
}
