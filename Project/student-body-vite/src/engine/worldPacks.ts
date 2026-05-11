import { LOCATIONS } from "../data/locations";
import { STARTER_NPCS } from "../data/npcs";
import type {
  CalendarEvent,
  GameState,
  LocationCategory,
  LocationDefinition,
  LocationDiscoveryState,
  LocationId,
  LocationKnowledgeRecord,
  Npc,
  NpcId,
  RelationshipRecord,
  WorldPack,
  WorldPackMeta,
} from "../types/game";
import { normalizeRelationshipRecord } from "./relationships";
import { appendEvent } from "./state";

const LOCATION_CATEGORIES = new Set<LocationCategory>(["campus", "town", "outdoor"]);
const DISCOVERY_RANK: Record<LocationDiscoveryState, number> = {
  unknown: 0,
  rumored: 1,
  known: 2,
  visited: 3,
};

export type WorldPackValidationSeverity = "warning" | "error";

export interface WorldPackValidationIssue {
  severity: WorldPackValidationSeverity;
  path: string;
  message: string;
}

export interface WorldPackImportSummary {
  name: string;
  npcCount: number;
  locationCount: number;
  scheduleCount: number;
  arcCount: number;
  eventCount: number;
  relationshipCount: number;
  knownLocationCount: number;
  rumoredLocationCount: number;
  warningCount: number;
  errorCount: number;
  issues: WorldPackValidationIssue[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeLocationCategory(value: unknown): LocationCategory {
  const raw = stringValue(value).toLowerCase();
  return LOCATION_CATEGORIES.has(raw as LocationCategory) ? raw as LocationCategory : "campus";
}

function normalizeIdList(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter(item => typeof item === "string" && item.trim()).map(item => item.trim()))] : [];
}

export function normalizeNpcMap(source: unknown): Record<NpcId, Npc> {
  const next: Record<NpcId, Npc> = {};

  if (Array.isArray(source)) {
    for (const item of source) {
      if (!isRecord(item)) continue;
      const id = stringValue(item.id, stringValue(item.key, stringValue(item.name)));
      if (!id) continue;
      next[id] = { id, name: stringValue(item.name, id), ...item } as Npc;
    }
    return next;
  }

  if (isRecord(source)) {
    for (const [key, value] of Object.entries(source)) {
      if (!isRecord(value)) continue;
      const id = stringValue(value.id, key);
      next[id] = { id, name: stringValue(value.name, id), ...value } as Npc;
    }
  }

  return next;
}

export function normalizeLocationMap(source: unknown): Record<LocationId, LocationDefinition> {
  const next: Record<LocationId, LocationDefinition> = {};

  const addLocation = (key: string, value: unknown) => {
    if (!isRecord(value)) return;
    const id = stringValue(value.id, key);
    if (!id) return;
    const hours = stringValue(value.hours);
    const initiallyKnown = typeof value.initiallyKnown === "boolean" ? value.initiallyKnown : undefined;
    const hiddenUntilDiscovered = typeof value.hiddenUntilDiscovered === "boolean" ? value.hiddenUntilDiscovered : undefined;
    next[id] = {
      id,
      label: stringValue(value.label, stringValue(value.name, id)),
      cat: normalizeLocationCategory(value.cat || value.category),
      description: stringValue(value.description, stringValue(value.brief, stringValue(value.summary, "No authored description recorded yet."))),
      ...(hours ? { hours } : {}),
      ...(typeof initiallyKnown === "boolean" ? { initiallyKnown } : {}),
      ...(typeof hiddenUntilDiscovered === "boolean" ? { hiddenUntilDiscovered } : {}),
    };
  };

  if (Array.isArray(source)) {
    source.forEach((item, index) => addLocation(isRecord(item) ? stringValue(item.id, `location_${index + 1}`) : `location_${index + 1}`, item));
    return next;
  }

  if (isRecord(source)) {
    Object.entries(source).forEach(([key, value]) => addLocation(key, value));
  }

  return next;
}

function mergeRecords<T>(base: T[] | Record<string, T> | undefined, next: Record<string, T>) {
  return { ...(Array.isArray(base) ? Object.fromEntries(base.map(item => [(item as { id?: string }).id, item]).filter(([id]) => id)) : base || {}), ...next };
}

function objectSize(value: unknown) {
  return isRecord(value) ? Object.keys(value).length : 0;
}

function arcCount(value: unknown) {
  if (Array.isArray(value)) return value.length;
  if (isRecord(value)) return Object.keys(value).length;
  return value == null ? 0 : 1;
}

function calendarEventSources(pack: WorldPack): unknown[] {
  const calendar = Array.isArray(pack.calendar)
    ? pack.calendar
    : pack.calendar && typeof pack.calendar === "object" && Array.isArray(pack.calendar.events)
      ? pack.calendar.events
      : [];
  return [
    ...(Array.isArray(pack.calendarEvents) ? pack.calendarEvents : []),
    ...calendar,
    ...(Array.isArray(pack.events) ? pack.events : []),
    ...(Array.isArray(pack.deadlines) ? pack.deadlines : []),
  ];
}

function normalizeCalendarEvents(pack: WorldPack): CalendarEvent[] {
  return calendarEventSources(pack).filter(event =>
    event
    && typeof event === "object"
    && !Array.isArray(event)
    && typeof (event as CalendarEvent).id === "string"
    && typeof (event as CalendarEvent).title === "string"
    && typeof (event as CalendarEvent).kind === "string"
    && typeof (event as CalendarEvent).day === "number"
    && typeof (event as CalendarEvent).startSlot === "number",
  ) as CalendarEvent[];
}

function normalizeRelationshipMap(source: unknown): Record<NpcId, RelationshipRecord | number | string> {
  const next: Record<NpcId, RelationshipRecord | number | string> = {};

  if (Array.isArray(source)) {
    for (const item of source) {
      if (!isRecord(item)) continue;
      const id = stringValue(item.npcId, stringValue(item.id));
      if (!id) continue;
      const record = { ...item };
      delete record.id;
      delete record.npcId;
      next[id] = record as unknown as RelationshipRecord;
    }
    return next;
  }

  if (isRecord(source)) {
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === "number" || typeof value === "string" || isRecord(value)) next[key] = value as RelationshipRecord | number | string;
    }
  }

  return next;
}

function normalizeRelationshipSeeds(pack: WorldPack): Record<NpcId, RelationshipRecord | number | string> {
  return {
    ...normalizeRelationshipMap(pack.relationships),
    ...normalizeRelationshipMap(pack.initialRelationships),
  };
}

function scheduleBlocks(source: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(source)) return source.filter(isRecord);
  if (!isRecord(source)) return [];

  const blocks: Array<Record<string, unknown>> = [];
  for (const value of Object.values(source)) {
    if (Array.isArray(value)) blocks.push(...value.filter(isRecord));
    else if (isRecord(value)) blocks.push(value);
  }
  return blocks;
}

function hasLocationId(id: string, importedLocations: Record<LocationId, LocationDefinition>) {
  return Boolean(importedLocations[id] || LOCATIONS[id]);
}

function hasNpcId(id: string, importedNpcs: Record<NpcId, Npc>) {
  return Boolean(importedNpcs[id] || STARTER_NPCS[id]);
}

function issue(severity: WorldPackValidationSeverity, path: string, message: string): WorldPackValidationIssue {
  return { severity, path, message };
}

function packMeta(pack: WorldPack, sourceFileName?: string): WorldPackMeta {
  return {
    id: stringValue(pack.id) || undefined,
    name: stringValue(pack.name, stringValue(pack.title, sourceFileName || "Imported world pack")),
    version: stringValue(pack.version) || undefined,
    author: stringValue(pack.author) || undefined,
    description: stringValue(pack.description) || undefined,
    sourceFileName,
    importedAt: new Date().toISOString(),
  };
}

export function validateWorldPack(pack: WorldPack): WorldPackValidationIssue[] {
  const issues: WorldPackValidationIssue[] = [];
  const npcs = {
    ...normalizeNpcMap(pack.npcs),
    ...normalizeNpcMap(pack.characters),
    ...normalizeNpcMap(pack.cast),
  };
  const locations = {
    ...normalizeLocationMap(pack.locations),
    ...normalizeLocationMap(pack.places),
  };
  const schedules = { ...(isRecord(pack.schedules) ? pack.schedules : {}), ...(isRecord(pack.npcSchedules) ? pack.npcSchedules : {}) };
  const relationships = normalizeRelationshipSeeds(pack);
  const knownLocationIds = normalizeIdList(pack.knownLocationIds);
  const rumoredLocationIds = normalizeIdList(pack.rumoredLocationIds);
  const calendarSources = calendarEventSources(pack);
  const validCalendarEvents = normalizeCalendarEvents(pack);
  const importableCount = Object.keys(npcs).length
    + Object.keys(locations).length
    + Object.keys(schedules).length
    + validCalendarEvents.length
    + arcCount(pack.arcs ?? pack.storyArcs)
    + Object.keys(relationships).length
    + knownLocationIds.length
    + rumoredLocationIds.length;

  if (!importableCount) {
    issues.push(issue("error", "$", "Pack did not contain importable NPCs, locations, schedules, relationships, calendar events, arcs, or discovery seeds."));
  }

  for (const [npcId, npc] of Object.entries(npcs)) {
    const locationId = npc.defaultLocation || npc.currentLocation || npc.location;
    if (locationId && !hasLocationId(locationId, locations)) {
      issues.push(issue("warning", `npcs.${npcId}`, `NPC references unknown location "${locationId}". Add it to locations or use a built-in location id.`));
    }
    if (!npc.schema) {
      issues.push(issue("warning", `npcs.${npcId}.schema`, "NPC has no schema; narrator and Roster detail will be thinner."));
    }
  }

  for (const [locationId, location] of Object.entries(locations)) {
    if (!location.description) {
      issues.push(issue("warning", `locations.${locationId}.description`, "Location has no description."));
    }
  }

  for (const [npcId, source] of Object.entries(schedules)) {
    for (const block of scheduleBlocks(source)) {
      const locationId = typeof block.location === "string" ? block.location : "";
      if (!locationId) {
        issues.push(issue("warning", `schedules.${npcId}`, "Schedule block has no location and will be ignored by NPC scheduling."));
      } else if (!hasLocationId(locationId, locations)) {
        issues.push(issue("warning", `schedules.${npcId}`, `Schedule references unknown location "${locationId}".`));
      }
    }
  }

  for (const locationId of [...knownLocationIds, ...rumoredLocationIds]) {
    if (!hasLocationId(locationId, locations)) {
      issues.push(issue("warning", "knownLocationIds", `Discovery seed references unknown location "${locationId}".`));
    }
  }

  for (const npcId of Object.keys(relationships)) {
    if (!hasNpcId(npcId, npcs)) {
      issues.push(issue("warning", `relationships.${npcId}`, `Relationship seed references unknown NPC "${npcId}".`));
    }
  }

  for (let index = 0; index < calendarSources.length; index += 1) {
    const rawEvent = calendarSources[index];
    if (!isRecord(rawEvent)) {
      issues.push(issue("warning", `calendarEvents.${index}`, "Calendar event is not an object and will be ignored."));
      continue;
    }
    if (typeof rawEvent.id !== "string" || typeof rawEvent.title !== "string" || typeof rawEvent.kind !== "string" || typeof rawEvent.day !== "number" || typeof rawEvent.startSlot !== "number") {
      issues.push(issue("warning", `calendarEvents.${index}`, "Calendar event is missing id, title, kind, day, or startSlot and will be ignored."));
      continue;
    }
    if (typeof rawEvent.location === "string" && !hasLocationId(rawEvent.location, locations)) {
      issues.push(issue("warning", `calendarEvents.${index}.location`, `Calendar event references unknown location "${rawEvent.location}".`));
    }
  }

  return issues;
}

export function summarizeWorldPack(pack: WorldPack, sourceFileName?: string): WorldPackImportSummary {
  const npcs = {
    ...normalizeNpcMap(pack.npcs),
    ...normalizeNpcMap(pack.characters),
    ...normalizeNpcMap(pack.cast),
  };
  const locations = {
    ...normalizeLocationMap(pack.locations),
    ...normalizeLocationMap(pack.places),
  };
  const schedules = { ...(pack.schedules || {}), ...(pack.npcSchedules || {}) };
  const arcs = pack.arcs ?? pack.storyArcs;
  const calendarEvents = normalizeCalendarEvents(pack);
  const relationships = normalizeRelationshipSeeds(pack);
  const knownLocationIds = normalizeIdList(pack.knownLocationIds);
  const rumoredLocationIds = normalizeIdList(pack.rumoredLocationIds);
  const issues = validateWorldPack(pack);

  return {
    name: packMeta(pack, sourceFileName).name || "Imported world pack",
    npcCount: Object.keys(npcs).length,
    locationCount: Object.keys(locations).length,
    scheduleCount: objectSize(schedules),
    arcCount: arcCount(arcs),
    eventCount: calendarEvents.length,
    relationshipCount: Object.keys(relationships).length,
    knownLocationCount: knownLocationIds.length,
    rumoredLocationCount: rumoredLocationIds.length,
    warningCount: issues.filter(item => item.severity === "warning").length,
    errorCount: issues.filter(item => item.severity === "error").length,
    issues,
  };
}

function nextDiscoveryState(current: LocationKnowledgeRecord | undefined, target: LocationDiscoveryState) {
  const currentState = current?.state || "unknown";
  return DISCOVERY_RANK[target] > DISCOVERY_RANK[currentState] ? target : currentState;
}

function mergeLocationKnowledge(
  state: GameState,
  knownLocationIds: LocationId[],
  rumoredLocationIds: LocationId[],
  source: string,
): Record<LocationId, LocationKnowledgeRecord> {
  const next = { ...(state.locationKnowledge || {}) };

  const mark = (locationId: LocationId, target: Exclude<LocationDiscoveryState, "unknown" | "visited">) => {
    const current = next[locationId];
    const stateAfterImport = nextDiscoveryState(current, target);
    next[locationId] = {
      ...current,
      state: stateAfterImport,
      discoveredDay: current?.discoveredDay ?? state.day,
      discoveredSlot: current?.discoveredSlot ?? state.timeSlot,
      source: current?.source || source,
      isNew: stateAfterImport !== "visited" && current?.state !== stateAfterImport,
      hoursKnown: stateAfterImport === "known" ? true : Boolean(current?.hoursKnown),
    };
  };

  rumoredLocationIds.forEach(locationId => mark(locationId, "rumored"));
  knownLocationIds.forEach(locationId => mark(locationId, "known"));

  return next;
}

export function applyWorldPack(state: GameState, pack: WorldPack, sourceFileName?: string) {
  const importedNpcs = {
    ...normalizeNpcMap(pack.npcs),
    ...normalizeNpcMap(pack.characters),
    ...normalizeNpcMap(pack.cast),
  };
  const importedLocations = {
    ...normalizeLocationMap(pack.locations),
    ...normalizeLocationMap(pack.places),
  };
  const importedSchedules = { ...(pack.schedules || {}), ...(pack.npcSchedules || {}) };
  const importedArcs = pack.arcs ?? pack.storyArcs;
  const importedCalendarEvents = normalizeCalendarEvents(pack);
  const importedRelationships = normalizeRelationshipSeeds(pack);
  const knownLocationIds = normalizeIdList(pack.knownLocationIds);
  const rumoredLocationIds = normalizeIdList(pack.rumoredLocationIds);
  const meta = packMeta(pack, sourceFileName);
  const summary = summarizeWorldPack(pack, sourceFileName);
  const existingPackMeta = state.world?.packMeta || [];
  const packMetaKey = meta.id || meta.sourceFileName || meta.name;
  const nextPackMeta = [
    ...existingPackMeta.filter(item => (item.id || item.sourceFileName || item.name) !== packMetaKey),
    meta,
  ];
  const relationshipSeeds = Object.fromEntries(
    Object.entries(importedRelationships).map(([npcId, record]) => [npcId, normalizeRelationshipRecord(record, npcId)]),
  );

  const nextState: GameState = {
    ...state,
    player: {
      ...state.player,
      relationships: {
        ...(state.player.relationships || {}),
        ...relationshipSeeds,
      },
    },
    locationKnowledge: mergeLocationKnowledge(state, knownLocationIds, rumoredLocationIds, `World pack: ${meta.name || sourceFileName || "import"}`),
    npcDirectory: {
      ...(state.npcDirectory || {}),
      ...importedNpcs,
    },
    npcsKnown: [...new Set([...(state.npcsKnown || []), ...(Array.isArray(pack.knownNpcIds) ? pack.knownNpcIds : [])])],
    flags: {
      ...(state.flags || {}),
      ...(pack.flags || {}),
    },
    world: {
      ...(state.world || {}),
      npcs: mergeRecords(state.world?.npcs, importedNpcs),
      locations: mergeRecords(state.world?.locations, importedLocations),
      schedules: {
        ...(state.world?.schedules || {}),
        ...(pack.schedules || {}),
      },
      npcSchedules: {
        ...(state.world?.npcSchedules || {}),
        ...(pack.npcSchedules || {}),
      },
      calendarEvents: [
        ...(state.world?.calendarEvents || []).filter(event => !importedCalendarEvents.some(imported => imported.id === event.id)),
        ...importedCalendarEvents,
      ],
      arcs: importedArcs ?? state.world?.arcs,
      storyArcs: importedArcs ?? state.world?.storyArcs,
      packMeta: nextPackMeta,
    },
  };

  return {
    state: appendEvent(
      nextState,
      `Imported world pack "${summary.name}" (${summary.npcCount} NPCs, ${summary.locationCount} locations, ${summary.relationshipCount} relationships, ${summary.scheduleCount} schedules, ${summary.eventCount} calendar events, ${summary.arcCount} arcs${summary.warningCount ? `, ${summary.warningCount} warnings` : ""}).`,
    ),
    summary,
  };
}
