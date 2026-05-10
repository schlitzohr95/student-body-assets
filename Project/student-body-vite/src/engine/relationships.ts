import type { Choice, GameEvent, GameState, NpcId, RelationshipMoment, RelationshipRecord } from "../types/game";

export type RelationshipFlagValue = boolean | number | string;

export interface RelationshipGate {
  npcId: NpcId;
  minScore?: number;
  minTrust?: number;
  maxAwkward?: number;
  flags?: Record<string, RelationshipFlagValue>;
}

export interface RelationshipUpdate {
  scoreDelta?: number;
  status?: string;
  traits?: string[];
  flags?: Record<string, RelationshipFlagValue>;
  lastSeenDisposition?: string;
}

export const DEFAULT_RELATIONSHIP_FLAGS: Record<string, RelationshipFlagValue> = {
  trust: 0,
  awkward: 0,
  texting: false,
  date_planned: false,
};

function numeric(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function compact<T>(values: Array<T | null | undefined | "">): T[] {
  return [...new Set(values.filter(Boolean) as T[])];
}

function relationshipAliases(state: GameState) {
  return compact([
    "roommate",
    ...Object.keys(state.player.relationships || {}),
    ...Object.keys(state.npcDirectory || {}),
    ...(state.npcsKnown || []),
  ]);
}

function momentId(state: GameState, npcId: NpcId, label: string) {
  const safeLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "moment";
  return `${state.day}-${state.timeSlot}-${npcId}-${safeLabel}`;
}

export function normalizeRelationshipRecord(raw: RelationshipRecord | number | string | undefined, npcId?: NpcId): RelationshipRecord {
  if (raw && typeof raw === "object") {
    return {
      ...raw,
      score: numeric(raw.score ?? raw.value ?? raw.affinity),
      status: raw.status || raw.summary || raw.label || (npcId === "roommate" ? "old friend" : "recorded"),
      traits: compact(raw.traits || []),
      flags: {
        ...DEFAULT_RELATIONSHIP_FLAGS,
        ...(npcId === "roommate" ? { trust: 2 } : {}),
        ...(raw.flags || {}),
      },
      recentMoments: Array.isArray(raw.recentMoments) ? raw.recentMoments.slice(-8) : [],
    };
  }

  if (typeof raw === "number" || typeof raw === "string") {
    return {
      score: numeric(raw),
      status: npcId === "roommate" ? "old friend" : "recorded",
      traits: [],
      flags: {
        ...DEFAULT_RELATIONSHIP_FLAGS,
        ...(npcId === "roommate" ? { trust: 2 } : {}),
      },
      recentMoments: [],
    };
  }

  return {
    score: npcId === "roommate" ? 4 : 0,
    status: npcId === "roommate" ? "old friend" : "known",
    traits: [],
    flags: {
      ...DEFAULT_RELATIONSHIP_FLAGS,
      ...(npcId === "roommate" ? { trust: 2 } : {}),
    },
    recentMoments: [],
  };
}

export function normalizeRelationships(state: GameState): Record<NpcId, RelationshipRecord> {
  const current = state.player.relationships || {};
  const ids = relationshipAliases(state);

  return Object.fromEntries(ids.map(npcId => [npcId, normalizeRelationshipRecord(current[npcId], npcId)]));
}

export function getRelationshipRecord(state: GameState, npcId: NpcId): RelationshipRecord {
  return normalizeRelationshipRecord(state.player.relationships?.[npcId], npcId);
}

export function getRelationshipScore(state: GameState, npcId: NpcId): number {
  return numeric(getRelationshipRecord(state, npcId).score);
}

export function getRelationshipFlag(state: GameState, npcId: NpcId, flag: string): RelationshipFlagValue {
  return getRelationshipRecord(state, npcId).flags?.[flag] ?? DEFAULT_RELATIONSHIP_FLAGS[flag] ?? false;
}

export function updateRelationship(state: GameState, npcId: NpcId, update: RelationshipUpdate): GameState {
  const current = getRelationshipRecord(state, npcId);
  const score = numeric(current.score) + (update.scoreDelta || 0);
  const traits = compact([...(current.traits || []), ...(update.traits || [])]);
  const relationships = {
    ...(state.player.relationships || {}),
    [npcId]: {
      ...current,
      score,
      status: update.status || current.status || "developing",
      traits,
      flags: {
        ...DEFAULT_RELATIONSHIP_FLAGS,
        ...(current.flags || {}),
        ...(update.flags || {}),
      },
      lastSeenDisposition: update.lastSeenDisposition || current.lastSeenDisposition || current.disposition,
      recentMoments: current.recentMoments || [],
    },
  };

  return {
    ...state,
    player: {
      ...state.player,
      relationships,
    },
  };
}

export function addSharedMoment(
  state: GameState,
  npcId: NpcId,
  moment: Omit<RelationshipMoment, "id" | "day" | "slot" | "location"> & Partial<Pick<RelationshipMoment, "id" | "day" | "slot" | "location">>,
): GameState {
  const current = getRelationshipRecord(state, npcId);
  const nextMoment: RelationshipMoment = {
    id: moment.id || momentId(state, npcId, moment.label),
    day: moment.day ?? state.day,
    slot: moment.slot ?? state.timeSlot,
    location: moment.location ?? state.location,
    label: moment.label,
    text: moment.text,
    tags: moment.tags,
  };
  const recentMoments = [...(current.recentMoments || []).filter(item => item.id !== nextMoment.id), nextMoment].slice(-8);

  return {
    ...state,
    player: {
      ...state.player,
      relationships: {
        ...(state.player.relationships || {}),
        [npcId]: {
          ...current,
          recentMoments,
        },
      },
    },
  };
}

export function addSharedMomentForMany(
  state: GameState,
  npcIds: NpcId[],
  moment: Omit<RelationshipMoment, "id" | "day" | "slot" | "location"> & Partial<Pick<RelationshipMoment, "day" | "slot" | "location">>,
): GameState {
  return npcIds.reduce((next, npcId) => addSharedMoment(next, npcId, moment), state);
}

export function getRecentSharedMoments(state: GameState, npcId: NpcId, limit = 6): RelationshipMoment[] {
  return (getRelationshipRecord(state, npcId).recentMoments || []).slice(-limit).reverse();
}

export function relationshipTimeline(state: GameState, npcId: NpcId, limit = 10) {
  const moments = getRecentSharedMoments(state, npcId, limit).map(moment => ({
    id: moment.id,
    day: moment.day,
    slot: moment.slot,
    label: moment.label,
    text: moment.text,
    kind: "moment" as const,
  }));
  const events = state.eventLog
    .filter(event => eventWitnessedBy(event, npcId))
    .slice(-limit)
    .reverse()
    .map((event, index) => ({
      id: `event-${event.day || 0}-${event.slot || 0}-${index}`,
      day: numeric(event.day, state.day),
      slot: numeric(event.slot ?? event.timeSlot),
      label: event.kind || "Event",
      text: event.text || event.summary || event.event_summary || event.label || "Recorded event.",
      kind: "event" as const,
    }));

  return [...moments, ...events]
    .sort((a, b) => (b.day - a.day) || (b.slot - a.slot))
    .slice(0, limit);
}

export function meetsRelationshipGate(state: GameState, gate: RelationshipGate): boolean {
  const record = getRelationshipRecord(state, gate.npcId);
  const flags = record.flags || {};
  if (typeof gate.minScore === "number" && numeric(record.score) < gate.minScore) return false;
  if (typeof gate.minTrust === "number" && numeric(flags.trust) < gate.minTrust) return false;
  if (typeof gate.maxAwkward === "number" && numeric(flags.awkward) > gate.maxAwkward) return false;
  if (gate.flags) {
    for (const [flag, value] of Object.entries(gate.flags)) {
      if (flags[flag] !== value) return false;
    }
  }
  return true;
}

export function gateChoice(state: GameState, choice: Choice, gate: RelationshipGate, disabledReason: string): Choice {
  return meetsRelationshipGate(state, gate) ? choice : { ...choice, disabledReason };
}

function eventWitnessedBy(event: GameEvent, npcId: NpcId): boolean {
  const witnesses = event.witnesses || event.witnessedBy || event.witnessIds || event.witness_ids || event.npcWitnesses || [];
  const normalized = witnesses.map(witness => typeof witness === "string" ? witness : witness.id || witness.key || witness.name);
  return normalized.includes(npcId) || normalized.includes("all") || normalized.includes("present");
}
