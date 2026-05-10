import type { NarratorProviderRequest, NarratorRunResult } from "./client";

export interface NarratorBenchScenario {
  id: string;
  label: string;
  focus: string;
  action: string;
  context: string;
  stateSummary: NarratorProviderRequest["stateSummary"];
  expectedWitnesses: string[];
  forbiddenKnowledge: string[];
}

export interface NarratorScoreFlag {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface NarratorBenchScore {
  passed: number;
  failed: number;
  total: number;
  flags: NarratorScoreFlag[];
}

export interface NarratorBenchResult {
  id: string;
  scenarioId: string;
  scenarioLabel: string;
  scenarioFocus: string;
  ranAt: string;
  action: string;
  model?: string;
  providerType: string;
  latencyMs: number;
  context: string;
  rawText: string;
  parsed: NarratorRunResult["parsed"];
  score: NarratorBenchScore;
}

const PLAYER_BASE = `# Player State
Stats: Charm: 37, Sensitivity: 41, Knowledge: 30, Athletics: 25, Grit: 30
Traits: attentive`;

export const BENCH_SCENARIOS: NarratorBenchScenario[] = [
  {
    id: "mari-continuity",
    label: "Mari Continuity",
    focus: "Uses existing relationship and recent shared moments without inventing a reset.",
    action: "Ask Mari, carefully, whether the shop always gets this quiet after lunch.",
    stateSummary: { day: 7, timeSlot: 48, location: "coffee_shop", presentNpcIds: ["studious"] },
    expectedWitnesses: ["studious"],
    forbiddenKnowledge: [],
    context: `# Scene
Week 1, Sunday, 12:00 PM (Afternoon)
Location: Coffee Shop [coffee_shop] - A warm independent shop off campus, all old wood, espresso hiss, and regulars with routines.
Player action: Ask Mari, carefully, whether the shop always gets this quiet after lunch.

${PLAYER_BASE}
Relationships with present NPCs: [{"npcId":"studious","name":"Mari","score":3,"status":"texting","lastSeenDisposition":"Professionally warm and curious."}]

# NPCs Present
[{"id":"studious","name":"Mari","role":"Coffee shop barista","schema":{"publicFace":"Capable, dryly warm, observant from behind the counter.","voice":"Quick, understated, lightly teasing when comfortable; concise when busy.","boundaries":["Work is still work","Private disclosures must be earned slowly"]},"currentMood":"Focused, professionally warm."}]

# Recent Relevant Event Log
- Week 1, Monday, 6:00 PM: Met Mari at the coffee shop. (witnesses: studious)
- Week 1, Sunday, 12:00 PM: Chatted with Mari at the coffee shop counter. (witnesses: studious)
- Week 1, Sunday, 12:00 PM: Texted Mari: Hey. Still alive over there? (witnesses: studious)`,
  },
  {
    id: "witness-boundary",
    label: "Witness Boundary",
    focus: "Keeps Jordan from knowing Mari-only private details.",
    action: "Ask the RA if he heard anything about the private coffee shop conversation with Mari.",
    stateSummary: { day: 7, timeSlot: 76, location: "dorm_hallway", presentNpcIds: ["ra"] },
    expectedWitnesses: ["ra"],
    forbiddenKnowledge: ["campus landmark", "hates being treated", "mari admitted"],
    context: `# Scene
Week 1, Sunday, 7:00 PM (Evening)
Location: Dorm Hallway [dorm_hallway] - Fluorescent lights, bulletin boards, and doors half-open to other lives.
Player action: Ask the RA if he heard anything about the private coffee shop conversation with Mari.

${PLAYER_BASE}
Relationships with present NPCs: [{"npcId":"ra","name":"Jordan","score":1,"status":"friendly authority","lastSeenDisposition":"Helpful but busy."}]

# NPCs Present
[{"id":"ra","name":"Jordan","role":"Resident assistant","schema":{"publicFace":"Friendly authority with a clipboard habit.","voice":"Clear, lightly amused, firm around boundaries.","boundaries":["Does not gossip about residents","Only knows what he witnessed or was told"]},"currentMood":"Tired but available."}]

# Recent Relevant Event Log
- Week 1, Sunday, 5:00 PM: Jordan reminded the hall about quiet hours. (witnesses: ra)

# Player-Only Memory Not Witnessed By Present NPCs
- Mari once admitted she hates being treated like a campus landmark. Jordan did not witness this and has not been told. The narrator may use this only for player continuity, never as Jordan's knowledge.`,
  },
  {
    id: "state-json-discipline",
    label: "State JSON Discipline",
    focus: "Returns small, parseable state changes after a low-pressure relationship beat.",
    action: "Make a low-pressure exit from the conversation and promise to text later.",
    stateSummary: { day: 7, timeSlot: 50, location: "coffee_shop", presentNpcIds: ["studious"] },
    expectedWitnesses: ["studious"],
    forbiddenKnowledge: [],
    context: `# Scene
Week 1, Sunday, 12:30 PM (Afternoon)
Location: Coffee Shop [coffee_shop] - A warm independent shop off campus, all old wood, espresso hiss, and regulars with routines.
Player action: Make a low-pressure exit from the conversation and promise to text later.

${PLAYER_BASE}
Relationships with present NPCs: [{"npcId":"studious","name":"Mari","score":3,"status":"texting","flags":{"trust":1,"awkward":0},"lastSeenDisposition":"Professionally warm and curious."}]

# NPCs Present
[{"id":"studious","name":"Mari","role":"Coffee shop barista","schema":{"voice":"Quick, understated, lightly teasing when comfortable; concise when busy.","whatLands":["Specific curiosity","Patience"],"whatFallsFlat":["Pushing when she is busy"]},"currentMood":"Busy but not closed off."}]

# Recent Relevant Event Log
- Week 1, Sunday, 12:00 PM: The player avoided pushing while Mari was busy. (witnesses: studious)`,
  },
];

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

export function scoreNarratorRun(run: NarratorRunResult, scenario: NarratorBenchScenario): NarratorBenchScore {
  const patch = run.parsed.statePatch;
  const eventSummary = eventSummaryFromPatch(patch);
  const witnesses = patch ? witnessIds(patch.witnesses || patch.witness_ids || patch.witnessIds) : [];
  const lowerText = run.rawText.toLowerCase();
  const leakedTerms = scenario.forbiddenKnowledge.filter(term => lowerText.includes(term.toLowerCase()));
  const stateText = patch ? JSON.stringify(patch) : "";

  const flags: NarratorScoreFlag[] = [
    {
      id: "narration",
      label: "Narration",
      passed: run.parsed.narration.trim().length >= 80,
      detail: run.parsed.narration.trim().length >= 80 ? "Has usable scene prose." : "Narration is missing or too thin.",
    },
    {
      id: "choices",
      label: "Choices",
      passed: run.parsed.open || (run.parsed.choices.length >= 2 && run.parsed.choices.length <= 4),
      detail: run.parsed.open ? "Allows open response." : `${run.parsed.choices.length} parsed choice(s).`,
    },
    {
      id: "state",
      label: "State JSON",
      passed: Boolean(patch) && !run.parsed.stateParseError,
      detail: patch && !run.parsed.stateParseError ? "State patch parsed cleanly." : "Missing or invalid [STATE] JSON.",
    },
    {
      id: "event-summary",
      label: "Event Summary",
      passed: eventSummary.trim().length >= 12,
      detail: eventSummary.trim() || "No useful event_summary found.",
    },
    {
      id: "witnesses",
      label: "Witnesses",
      passed: scenario.expectedWitnesses.every(id => witnesses.includes(id)),
      detail: witnesses.length ? witnesses.join(", ") : "No witnesses in state patch.",
    },
    {
      id: "forbidden-knowledge",
      label: "Witness Boundary",
      passed: leakedTerms.length === 0,
      detail: leakedTerms.length ? `Leaked: ${leakedTerms.join(", ")}` : "No forbidden private details surfaced.",
    },
    {
      id: "patch-size",
      label: "Patch Size",
      passed: stateText.length <= 1800,
      detail: `${stateText.length} JSON chars.`,
    },
  ];

  const passed = flags.filter(flag => flag.passed).length;
  return { passed, failed: flags.length - passed, total: flags.length, flags };
}

export function makeBenchResult(run: NarratorRunResult, scenario: NarratorBenchScenario): NarratorBenchResult {
  return {
    id: `${scenario.id}-${Date.now()}`,
    scenarioId: scenario.id,
    scenarioLabel: scenario.label,
    scenarioFocus: scenario.focus,
    ranAt: new Date().toISOString(),
    action: scenario.action,
    model: run.request.model,
    providerType: run.provider.type,
    latencyMs: run.latencyMs,
    context: run.context,
    rawText: run.rawText,
    parsed: run.parsed,
    score: scoreNarratorRun(run, scenario),
  };
}
