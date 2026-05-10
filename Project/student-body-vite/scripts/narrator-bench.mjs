import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const PROXY_URL = process.env.NARRATOR_BENCH_PROXY_URL || "http://127.0.0.1:8787";
const NARRATE_URL = `${PROXY_URL}/narrate`;
const MODELS_URL = `${PROXY_URL}/models/openrouter/free`;
const OUT_DIR = join(ROOT_DIR, "bench-runs");

const SYSTEM_PROMPT = `You are the narrator for "Student Body," a single-player narrative college life sim.

Write grounded, concrete third-person prose from the protagonist's perspective. Do not explain mechanics in prose. Do not pre-warn or gate actions based on stats.

NPC knowledge rule: NPCs only know what they witnessed or were told. If the context includes player-only memory or events not witnessed by a present NPC, use that information only for narration continuity; never have the NPC reveal, imply, react to, or quote it as knowledge.

Respond with:
1. Narrative prose, one to four paragraphs.
2. A [CHOICES] block with 2-4 options, or [OPEN].
3. A [STATE] JSON tail with event_summary, witnesses, and any state changes. Use NPC ids for witnesses, not display names.

Format rules:
- The markers must be exactly [CHOICES], [OPEN], and [STATE]. Do not bold them.
- The response is invalid without [STATE].
- Keep [STATE] small and valid JSON with no markdown fence.

Keep continuity with the event log and present NPC schemas.`;

const PLAYER_BASE = `# Player State
Stats: Charm: 37, Sensitivity: 41, Knowledge: 30, Athletics: 25, Grit: 30
Traits: attentive`;

const SCENARIOS = [
  {
    id: "mari-continuity",
    label: "Mari Continuity",
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
  {
    id: "format-stress",
    label: "Format Stress",
    action: "Let the conversation hang for one beat, then choose a small honest answer.",
    stateSummary: { day: 8, timeSlot: 39, location: "library_main", presentNpcIds: ["professor"] },
    expectedWitnesses: ["professor"],
    forbiddenKnowledge: [],
    context: `# Scene
Week 2, Monday, 9:45 AM (Morning)
Location: Library [library_main] - Long tables, dust-warm light, and the pressure of other people pretending not to be behind.
Player action: Let the conversation hang for one beat, then choose a small honest answer.

# Player State
Stats: Charm: 31, Sensitivity: 44, Knowledge: 29, Athletics: 25, Grit: 34
Traits: tired, avoiding office hours
Relationships with present NPCs: [{"npcId":"professor","name":"Dr. Imani Vale","score":0,"status":"instructor","lastSeenDisposition":"Concerned but not unkind."}]

# NPCs Present
[{"id":"professor","name":"Dr. Imani Vale","role":"Intro seminar professor","schema":{"voice":"Precise, patient, direct when something matters.","wants":["Students to ask before they vanish academically"],"boundaries":["Does not become a therapist","Will name academic consequences clearly"]},"currentMood":"Concerned and observant."}]

# Recent Relevant Event Log
- Week 2, Monday, 9:30 AM: Dr. Vale found the player staring at the same paragraph for ten minutes. (witnesses: professor)`,
  },
];

const PREFERRED_MODELS = [
  "baidu/cobuddy:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "openai/gpt-oss-20b:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "google/gemma-4-26b-a4b-it:free",
];

function argValue(name) {
  const prefix = `${name}=`;
  const value = process.argv.slice(2).find(arg => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : "";
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseNarrator(text) {
  const rawText = String(text || "")
    .trim()
    .replace(/\*\*\s*\[(CHOICES|OPEN|STATE|\/CHOICES|\/STATE)\]\s*\*\*/gi, "[$1]")
    .replace(/__\s*\[(CHOICES|OPEN|STATE|\/CHOICES|\/STATE)\]\s*__/gi, "[$1]");
  const stateMatch = rawText.match(/\[STATE\]\s*([\s\S]*?)(?:\[\/STATE\]|$)/);
  let statePatch = null;
  let stateParseError = null;
  if (stateMatch) {
    try {
      const cleanJson = stateMatch[1]
        .trim()
        .replace(/^```(?:json|js|javascript)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      statePatch = JSON.parse(cleanJson);
    } catch (error) {
      stateParseError = error.message;
    }
  }

  const choicesMatch = rawText.match(/\[CHOICES\]\s*([\s\S]*?)(?:\[\/CHOICES\]|\[OPEN\]|\[STATE\]|$)/);
  const choices = choicesMatch
    ? choicesMatch[1].split("\n").map(line => line.trim().replace(/^\d+[\).]\s*/, "").replace(/^[-*]\s*/, "")).filter(Boolean)
    : [];

  return {
    narration: rawText.split(/\[CHOICES\]|\[OPEN\]|\[STATE\]/)[0].trim(),
    choices,
    open: /\[OPEN\]/.test(rawText),
    statePatch,
    stateParseError,
  };
}

function witnessIds(value) {
  if (!Array.isArray(value)) return [];
  return value.map(item => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") return String(item.id || item.key || item.name || "");
    return "";
  }).filter(Boolean);
}

function eventSummaryFromPatch(patch) {
  if (!patch) return "";
  return typeof patch.event_summary === "string"
    ? patch.event_summary
    : typeof patch.eventSummary === "string"
      ? patch.eventSummary
      : "";
}

function score(parsed, rawText, scenario) {
  const patch = parsed.statePatch;
  const eventSummary = eventSummaryFromPatch(patch);
  const witnesses = patch ? witnessIds(patch.witnesses || patch.witness_ids || patch.witnessIds) : [];
  const leakedTerms = scenario.forbiddenKnowledge.filter(term => rawText.toLowerCase().includes(term.toLowerCase()));
  const stateText = patch ? JSON.stringify(patch) : "";
  const flags = [
    ["narration", parsed.narration.trim().length >= 80, parsed.narration.trim().length >= 80 ? "Has usable scene prose." : "Narration is missing or too thin."],
    ["choices", parsed.open || (parsed.choices.length >= 2 && parsed.choices.length <= 4), parsed.open ? "Allows open response." : `${parsed.choices.length} parsed choice(s).`],
    ["state", Boolean(patch) && !parsed.stateParseError, patch && !parsed.stateParseError ? "State patch parsed cleanly." : `Missing or invalid [STATE] JSON${parsed.stateParseError ? `: ${parsed.stateParseError}` : "."}`],
    ["event-summary", eventSummary.trim().length >= 12, eventSummary.trim() || "No useful event_summary found."],
    ["witnesses", scenario.expectedWitnesses.every(id => witnesses.includes(id)), witnesses.length ? witnesses.join(", ") : "No witnesses in state patch."],
    ["forbidden-knowledge", leakedTerms.length === 0, leakedTerms.length ? `Leaked: ${leakedTerms.join(", ")}` : "No forbidden private details surfaced."],
    ["patch-size", stateText.length <= 1800, `${stateText.length} JSON chars.`],
  ].map(([id, passed, detail]) => ({ id, passed, detail }));
  const passed = flags.filter(flag => flag.passed).length;
  return { passed, failed: flags.length - passed, total: flags.length, flags };
}

async function jsonFetch(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { text };
  }
  return { response, payload };
}

async function availableModels() {
  const { response, payload } = await jsonFetch(MODELS_URL);
  if (!response.ok) throw new Error(`Could not fetch models: ${response.status}`);
  return Array.isArray(payload.models) ? payload.models : [];
}

async function runOne(model, scenario) {
  const started = Date.now();
  const body = {
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: scenario.context }],
    context: scenario.context,
    action: scenario.action,
    model,
    stateSummary: scenario.stateSummary,
  };
  const { response, payload } = await jsonFetch(NARRATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const rawText = payload.text || "";
  const parsed = parseNarrator(rawText);
  return {
    id: `${model}:${scenario.id}`,
    model,
    scenarioId: scenario.id,
    scenarioLabel: scenario.label,
    status: response.status,
    latencyMs: Date.now() - started,
    error: payload.error || null,
    rawText,
    parsed,
    score: response.ok ? score(parsed, rawText, scenario) : null,
  };
}

function summarize(results) {
  const byModel = new Map();
  for (const result of results) {
    const current = byModel.get(result.model) || { model: result.model, calls: 0, ok: 0, score: 0, possible: 0, failures: {} };
    current.calls += 1;
    if (result.status === 200 && result.score) {
      current.ok += 1;
      current.score += result.score.passed;
      current.possible += result.score.total;
      for (const flag of result.score.flags) {
        if (!flag.passed) current.failures[flag.id] = (current.failures[flag.id] || 0) + 1;
      }
    } else {
      current.failures[`http-${result.status}`] = (current.failures[`http-${result.status}`] || 0) + 1;
    }
    byModel.set(result.model, current);
  }
  return [...byModel.values()].map(item => ({
    ...item,
    percent: item.possible ? Math.round((item.score / item.possible) * 100) : 0,
  })).sort((a, b) => b.percent - a.percent || b.ok - a.ok);
}

const allModels = await availableModels();
const allIds = new Set(allModels.map(model => model.id));
const explicitModels = argValue("--models").split(",").map(value => value.trim()).filter(Boolean);
const limit = Number(argValue("--limit")) || 6;
const selectedModels = (explicitModels.length ? explicitModels : PREFERRED_MODELS)
  .filter(id => allIds.has(id))
  .slice(0, limit);

if (!selectedModels.length) throw new Error("No selected models are currently available.");

const results = [];
for (const model of selectedModels) {
  for (const scenario of SCENARIOS) {
    process.stdout.write(`Running ${model} / ${scenario.id}... `);
    try {
      const result = await runOne(model, scenario);
      results.push(result);
      const marker = result.score ? `${result.score.passed}/${result.score.total}` : result.status;
      process.stdout.write(`${marker}\n`);
    } catch (error) {
      results.push({
        id: `${model}:${scenario.id}`,
        model,
        scenarioId: scenario.id,
        scenarioLabel: scenario.label,
        status: 0,
        latencyMs: 0,
        error: error instanceof Error ? error.message : String(error),
        rawText: "",
        parsed: null,
        score: null,
      });
      process.stdout.write(`ERROR\n`);
    }
    await sleep(750);
  }
}

const report = {
  exportedAt: new Date().toISOString(),
  proxyUrl: PROXY_URL,
  selectedModels,
  scenarios: SCENARIOS.map(({ id, label, action, expectedWitnesses, forbiddenKnowledge }) => ({
    id,
    label,
    action,
    expectedWitnesses,
    forbiddenKnowledge,
  })),
  summary: summarize(results),
  results,
};

mkdirSync(OUT_DIR, { recursive: true });
const outFile = join(OUT_DIR, `narrator-bench-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
writeFileSync(outFile, JSON.stringify(report, null, 2), "utf8");

console.log("\nSummary:");
for (const row of report.summary) {
  console.log(`${row.percent}% ${row.model} (${row.ok}/${row.calls} ok) failures=${JSON.stringify(row.failures)}`);
}
console.log(`\nWrote ${outFile}`);
