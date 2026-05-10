import type { GameState, LocationCategory, LocationDefinition, Npc, NpcId, WorldPack, WorldPackMeta } from "../types/game";
import { appendEvent } from "./state";

const LOCATION_CATEGORIES = new Set<LocationCategory>(["campus", "town", "outdoor"]);

export interface WorldPackImportSummary {
  name: string;
  npcCount: number;
  locationCount: number;
  scheduleCount: number;
  arcCount: number;
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

export function normalizeLocationMap(source: unknown): Record<string, LocationDefinition> {
  const next: Record<string, LocationDefinition> = {};

  const addLocation = (key: string, value: unknown) => {
    if (!isRecord(value)) return;
    const id = stringValue(value.id, key);
    if (!id) return;
    next[id] = {
      id,
      label: stringValue(value.label, stringValue(value.name, id)),
      cat: normalizeLocationCategory(value.cat || value.category),
      description: stringValue(value.description, stringValue(value.brief, stringValue(value.summary, "No authored description recorded yet."))),
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

  return {
    name: packMeta(pack, sourceFileName).name || "Imported world pack",
    npcCount: Object.keys(npcs).length,
    locationCount: Object.keys(locations).length,
    scheduleCount: objectSize(schedules),
    arcCount: arcCount(arcs),
  };
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
  const meta = packMeta(pack, sourceFileName);
  const summary = summarizeWorldPack(pack, sourceFileName);
  const existingPackMeta = state.world?.packMeta || [];
  const packMetaKey = meta.id || meta.sourceFileName || meta.name;
  const nextPackMeta = [
    ...existingPackMeta.filter(item => (item.id || item.sourceFileName || item.name) !== packMetaKey),
    meta,
  ];

  const nextState: GameState = {
    ...state,
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
      arcs: importedArcs ?? state.world?.arcs,
      storyArcs: importedArcs ?? state.world?.storyArcs,
      packMeta: nextPackMeta,
    },
  };

  return {
    state: appendEvent(
      nextState,
      `Imported world pack "${summary.name}" (${summary.npcCount} NPCs, ${summary.locationCount} locations, ${summary.scheduleCount} schedules, ${summary.arcCount} arcs).`,
    ),
    summary,
  };
}
