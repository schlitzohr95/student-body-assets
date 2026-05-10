import { DAY_LABELS, formatTimeOfDay, LOCATIONS } from "../data/locations";
import { STARTER_NPCS } from "../data/npcs";
import { normalizeLocationMap } from "../engine/worldPacks";
import { getChemistryObservationsForNpc } from "../engine/chemistry";
import type { GameEvent, GameState, LocationDefinition, Npc } from "../types/game";

const NARRATOR_EVENT_LIMIT = 10;

const asArray = <T,>(value: T | T[] | null | undefined): T[] => {
  if (Array.isArray(value)) return value;
  if (value == null || value === "") return [];
  return [value];
};

const uniqueCompact = <T,>(values: Array<T | null | undefined | "">): T[] => [...new Set(values.filter(Boolean) as T[])];

function getNpcDirectory(state: GameState): Record<string, Npc> {
  const directory: Record<string, Npc> = { ...STARTER_NPCS, ...(state.npcDirectory || {}) };
  const sources = [state.world?.npcs, state.world?.characters];

  for (const source of sources) {
    if (Array.isArray(source)) {
      for (const npc of source) {
        if (!npc || typeof npc !== "object") continue;
        directory[npc.id] = { ...(directory[npc.id] || {}), ...npc };
      }
    } else if (source && typeof source === "object") {
      Object.assign(directory, source);
    }
  }

  return directory;
}

function getLocationDirectory(state: GameState): Record<string, LocationDefinition> {
  return {
    ...LOCATIONS,
    ...normalizeLocationMap(state.world?.locations),
  };
}

function getExplicitPresentNpcs(state: GameState, directory: Record<string, Npc>): Npc[] | null {
  const explicit = state.presentNpcIds || state.presentNpcs || state.scene?.presentNpcIds || state.scene?.npcsPresent || state.currentScene?.presentNpcIds || state.currentScene?.npcsPresent;
  if (!Array.isArray(explicit)) return null;

  return explicit
    .map(npc => {
      if (typeof npc === "string") return directory[npc] || { id: npc, name: npc, schema: {} };
      const id = npc.id || npc.portraitKey || npc.name;
      return id ? { ...(directory[id] || {}), ...npc, id, schema: { ...(directory[id]?.schema || {}), ...(npc.schema || {}) } } : null;
    })
    .filter(Boolean) as Npc[];
}

function getPresentNpcs(state: GameState, directory: Record<string, Npc>): Npc[] {
  const explicitNpcs = getExplicitPresentNpcs(state, directory);
  if (explicitNpcs) return explicitNpcs;

  const locatedNpcs = Object.values(directory).filter(npc => npc.currentLocation === state.location || npc.location === state.location);
  if (locatedNpcs.length) return locatedNpcs;

  if (state.location === "coffee_shop") return [directory.studious];
  if (state.location === "dorm_room" && state.introSeen) return [directory.roommate];
  return [];
}

function relationshipForNpc(state: GameState, npc: Npc) {
  const relationships = state.player.relationships || {};
  const record = relationships[npc.id] || (npc.portraitKey ? relationships[npc.portraitKey] : undefined) || relationships[npc.name];

  if (record && typeof record === "object") {
    return {
      score: record.score ?? record.value ?? record.affinity ?? "unknown",
      status: record.status || record.summary || record.label || "recorded",
      traits: uniqueCompact(record.traits || []),
      lastSeenDisposition: record.lastSeenDisposition || record.disposition,
    };
  }

  if (typeof record === "number" || typeof record === "string") {
    return { score: record, status: "recorded", traits: [], lastSeenDisposition: npc.lastSeenDisposition };
  }

  return {
    score: 0,
    status: "no relationship record yet",
    traits: [],
    lastSeenDisposition: npc.lastSeenDisposition || "No prior disposition recorded.",
  };
}

function getNpcMood(state: GameState, npc: Npc) {
  return state.npcMoods?.[npc.id] || (npc.portraitKey ? state.npcMoods?.[npc.portraitKey] : undefined) || npc.currentMood || npc.mood || "Unspecified; use established schema and recent witnessed events.";
}

function stripNpcSchemaNoise(npc: Npc) {
  const omitted = new Set(["currentMood", "mood", "lastSeenDisposition", "currentLocation", "location", "defaultLocation", "portraitSvg", "portrait", "image", "imageUrl"]);
  const schema = npc.schema && Object.keys(npc.schema).length ? npc.schema : npc;
  return Object.fromEntries(Object.entries(schema).filter(([key]) => !omitted.has(key)));
}

function normalizeWitnessIds(event: GameEvent): string[] {
  return uniqueCompact(asArray(event.witnesses || event.witnessedBy || event.witness_ids || event.witnessIds || event.npcWitnesses))
    .map(witness => (typeof witness === "string" ? witness : witness.id || witness.key || witness.name))
    .filter(Boolean) as string[];
}

function eventText(event: GameEvent): string {
  return event.text || event.summary || event.event_summary || event.label || event.kind || "";
}

function eventMatchesPresentWitness(event: GameEvent, presentNpcs: Npc[]): boolean {
  if (!presentNpcs.length) return false;

  const presentAliases = new Set(
    presentNpcs
      .flatMap(npc => [npc.id, npc.portraitKey, npc.name])
      .filter(Boolean)
      .map(value => String(value).toLowerCase()),
  );
  const witnesses = normalizeWitnessIds(event).map(value => String(value).toLowerCase());

  if (witnesses.some(value => value === "all" || value === "present")) return true;
  if (witnesses.length) return witnesses.some(value => presentAliases.has(value));

  const lowerText = eventText(event).toLowerCase();
  return [...presentAliases].some(alias => alias && lowerText.includes(alias));
}

function formatEventForNarrator(event: GameEvent): string {
  const day = event.day ?? event.semesterDay ?? event.dayNumber;
  const week = event.week ?? (typeof day === "number" ? Math.floor((day - 1) / 7) + 1 : undefined);
  const dayName = typeof day === "number" ? DAY_LABELS[(day - 1) % DAY_LABELS.length] : event.dayName;
  const rawSlot = event.slot ?? event.timeSlot;
  const slot = typeof rawSlot === "number" ? formatTimeOfDay(rawSlot) : rawSlot;
  const when = [week ? `Week ${week}` : null, dayName || (day ? `Day ${day}` : null), slot].filter(Boolean).join(", ");
  const witnesses = normalizeWitnessIds(event);
  const witnessText = witnesses.length ? ` (witnesses: ${witnesses.join(", ")})` : "";
  return `- ${when ? `${when}: ` : ""}${eventText(event)}${witnessText}`;
}

export function buildNarratorContext(state: GameState, action?: string | { label?: string; text?: string; description?: string }): string {
  const week = Math.floor((state.day - 1) / 7) + 1;
  const dayName = DAY_LABELS[(state.day - 1) % DAY_LABELS.length];
  const timeSlot = formatTimeOfDay(state.timeSlot);
  const locationDirectory = getLocationDirectory(state);
  const location = locationDirectory[state.location] || { id: state.location, label: state.location, cat: "campus", description: "No static description recorded yet." };
  const npcDirectory = getNpcDirectory(state);
  const presentNpcs = getPresentNpcs(state, npcDirectory);
  const actionText = typeof action === "string" ? action.trim() : action?.label || action?.text || action?.description || "";

  const relationships = presentNpcs.map(npc => {
    const relationship = relationshipForNpc(state, npc);
    return {
      npcId: npc.id,
      name: npc.name || npc.id,
      score: relationship.score,
      status: relationship.status,
      traits: relationship.traits,
      lastSeenDisposition: relationship.lastSeenDisposition || npc.lastSeenDisposition || "No prior disposition recorded.",
    };
  });

  const npcPayload = presentNpcs.map(npc => {
    const relationship = relationshipForNpc(state, npc);
    return {
      id: npc.id,
      name: npc.name || npc.id,
      archetype: npc.archetype,
      role: npc.role,
      portraitKey: npc.portraitKey,
      schema: stripNpcSchemaNoise(npc),
      currentMood: getNpcMood(state, npc),
      lastSeenDisposition: relationship.lastSeenDisposition || npc.lastSeenDisposition || "No prior disposition recorded.",
      relationshipToPlayer: {
        score: relationship.score,
        status: relationship.status,
        traits: relationship.traits,
      },
    };
  });

  const relevantEvents = state.eventLog
    .slice()
    .reverse()
    .filter(event => eventMatchesPresentWitness(event, presentNpcs))
    .slice(0, NARRATOR_EVENT_LIMIT)
    .reverse();

  const recentEventText = relevantEvents.length
    ? relevantEvents.map(formatEventForNarrator).join("\n")
    : presentNpcs.length
      ? "- none recorded that were witnessed by the present NPCs"
      : "- none included; no NPCs are currently present";
  const visibleObservations = presentNpcs
    .flatMap(npc => getChemistryObservationsForNpc(state, npc.id))
    .filter((observation, index, all) => all.findIndex(item => item.id === observation.id) === index)
    .slice(0, 5);
  const observationText = visibleObservations.length
    ? visibleObservations.map(observation => `- ${observation.label}: ${observation.text}`).join("\n")
    : "- none revealed for the present NPCs";

  return [
    "# Scene",
    `Week ${week}, ${dayName} (semester day ${state.day}), ${timeSlot}`,
    `Location: ${location.label || state.location} [${state.location}] - ${location.description || "No static description recorded yet."}`,
    `Player action: ${actionText || "[arrived at location]"}`,
    "",
    "# Player State",
    `Stats: Charm: ${state.player.stats.charm}, Sensitivity: ${state.player.stats.sensitivity}, Knowledge: ${state.player.stats.knowledge}, Athletics: ${state.player.stats.athletics}, Grit: ${state.player.stats.grit}`,
    `Traits: ${state.player.traits?.length ? state.player.traits.join(", ") : "none recorded yet"}`,
    `Relationships with present NPCs: ${relationships.length ? JSON.stringify(relationships, null, 2) : "none; no NPCs present"}`,
    "",
    "# NPCs Present",
    npcPayload.length ? JSON.stringify(npcPayload, null, 2) : "[]",
    "",
    `# Recent Relevant Event Log (filtered to events witnessed by present NPCs, max ${NARRATOR_EVENT_LIMIT})`,
    recentEventText,
    "",
    "# Player-Visible Social Observations",
    observationText,
  ].join("\n");
}
