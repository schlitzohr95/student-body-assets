import { appendEvent } from "../engine/state";
import type { GameEvent, GameState, Npc, RelationshipRecord, StatKey } from "../types/game";

const STAT_KEYS: StatKey[] = ["charm", "sensitivity", "knowledge", "athletics", "grit"];

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const asStringArray = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const clampStat = (value: number) => Math.max(0, Math.min(100, value));

function asWitnesses(value: unknown): GameEvent["witnesses"] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      if (typeof item === "string") return item;
      if (!isRecord(item)) return null;
      const id = typeof item.id === "string" ? item.id : undefined;
      const key = typeof item.key === "string" ? item.key : undefined;
      const name = typeof item.name === "string" ? item.name : undefined;
      return id || key || name ? { id, key, name } : null;
    })
    .filter(Boolean) as GameEvent["witnesses"];
}

function applyStatChanges(state: GameState, changes: unknown): GameState {
  if (!isRecord(changes)) return state;
  const stats = { ...state.player.stats };
  let changed = false;

  for (const [stat, delta] of Object.entries(changes)) {
    const key = stat.toLowerCase() as StatKey;
    if (!STAT_KEYS.includes(key) || typeof delta !== "number") continue;
    stats[key] = clampStat(stats[key] + delta);
    changed = true;
  }

  return changed ? { ...state, player: { ...state.player, stats } } : state;
}

function applyResourceChanges(state: GameState, changes: unknown): GameState {
  if (!isRecord(changes)) return state;
  const resources = { ...state.player.resources };
  let changed = false;

  for (const [resource, delta] of Object.entries(changes)) {
    if (!(resource in resources) || typeof delta !== "number") continue;
    const cap = resource === "energy" ? 100 : Number.MAX_SAFE_INTEGER;
    resources[resource as keyof typeof resources] = Math.max(0, Math.min(cap, resources[resource as keyof typeof resources] + delta));
    changed = true;
  }

  return changed ? { ...state, player: { ...state.player, resources } } : state;
}

function applyTraitChanges(state: GameState, changes: unknown): GameState {
  if (!isRecord(changes)) return state;
  const current = state.player.traits || [];
  const remove = new Set(asStringArray(changes.remove).map(trait => trait.toLowerCase()));
  const add = asStringArray(changes.add);
  const traits = [...new Set([...current.filter(trait => !remove.has(trait.toLowerCase())), ...add])];
  return { ...state, player: { ...state.player, traits } };
}

function applyRelationshipChanges(state: GameState, changes: unknown): GameState {
  if (!isRecord(changes)) return state;
  const relationships = { ...(state.player.relationships || {}) };

  for (const [npcId, change] of Object.entries(changes)) {
    const current = relationships[npcId];
    const record: RelationshipRecord = current && typeof current === "object"
      ? { ...(current as RelationshipRecord) }
      : { score: typeof current === "number" ? current : 0 };

    if (typeof change === "number") {
      record.score = (typeof record.score === "number" ? record.score : 0) + change;
    } else if (isRecord(change)) {
      Object.assign(record, change);
      if (typeof change.delta === "number") {
        record.score = (typeof record.score === "number" ? record.score : 0) + change.delta;
        delete (record as unknown as Record<string, unknown>).delta;
      }
    }

    relationships[npcId] = record;
  }

  return { ...state, player: { ...state.player, relationships } };
}

function applyKnownNpcChanges(state: GameState, newNpcs: unknown): GameState {
  if (!Array.isArray(newNpcs) || !newNpcs.length) return state;

  const npcDirectory = { ...(state.npcDirectory || {}) };
  const npcsKnown = [...state.npcsKnown];

  for (const rawNpc of newNpcs) {
    if (!isRecord(rawNpc)) continue;
    const id = String(rawNpc.id || rawNpc.key || rawNpc.portraitKey || rawNpc.name || "");
    if (!id) continue;
    const npc = { ...(npcDirectory[id] || {}), ...rawNpc, id } as Npc;
    npcDirectory[id] = npc;
    const knownKey = npc.portraitKey || id;
    if (knownKey && !npcsKnown.includes(knownKey)) npcsKnown.push(knownKey);
  }

  return { ...state, npcDirectory, npcsKnown };
}

export function applyNarratorStatePatch(state: GameState, patch: Record<string, unknown> | null): GameState {
  if (!patch) return state;

  let next = state;
  const eventSummary = typeof patch.event_summary === "string"
    ? patch.event_summary
    : typeof patch.eventSummary === "string"
      ? patch.eventSummary
      : "";

  if (eventSummary.trim()) {
    next = appendEvent(next, eventSummary.trim(), asWitnesses(patch.witnesses || patch.witness_ids || patch.witnessIds));
  }

  next = applyStatChanges(next, patch.stat_changes || patch.statDeltas);
  next = applyResourceChanges(next, patch.resource_changes || patch.resourceDeltas);
  next = applyTraitChanges(next, patch.trait_changes);
  next = applyRelationshipChanges(next, patch.relationship_changes);
  next = applyKnownNpcChanges(next, patch.new_npcs || patch.newNpcs);

  if (isRecord(patch.npc_mood_changes)) {
    next = { ...next, npcMoods: { ...(next.npcMoods || {}), ...(patch.npc_mood_changes as Record<string, string>) } };
  }

  if (isRecord(patch.flags)) {
    next = { ...next, flags: { ...(next.flags || {}), ...patch.flags } };
  }

  return next;
}
