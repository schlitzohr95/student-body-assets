import { LOCATIONS, timeChunk } from "../data/locations";
import type { GameState, LocationDefinition, LocationDiscoveryState, LocationId, LocationKnowledgeRecord } from "../types/game";

const DISCOVERY_RANK: Record<LocationDiscoveryState, number> = {
  unknown: 0,
  rumored: 1,
  known: 2,
  visited: 3,
};

const COFFEE_SHOP_INTEL: LocationKnowledgeRecord = {
  state: "rumored",
  discoveredDay: 1,
  discoveredSlot: timeChunk(8),
  source: "Marcus's fridge note",
  isNew: true,
  hoursKnown: false,
};

export function makeInitialLocationKnowledge(): Record<LocationId, LocationKnowledgeRecord> {
  return {
    dorm_room: {
      state: "visited",
      discoveredDay: 1,
      discoveredSlot: timeChunk(8),
      source: "Dorm assignment",
      hoursKnown: true,
    },
    coffee_shop: { ...COFFEE_SHOP_INTEL },
  };
}

function defaultKnowledge(locationId: LocationId, location?: LocationDefinition): LocationKnowledgeRecord {
  const definition = location || LOCATIONS[locationId];
  if (definition?.hiddenUntilDiscovered || definition?.initiallyKnown === false) {
    return {
      state: "unknown",
      hoursKnown: false,
    };
  }

  return {
    state: "known",
    hoursKnown: false,
  };
}

function normalizeRecord(value: LocationKnowledgeRecord | undefined, fallback: LocationKnowledgeRecord): LocationKnowledgeRecord {
  const state = value?.state && value.state in DISCOVERY_RANK ? value.state : fallback.state;
  return {
    ...fallback,
    ...value,
    state,
    hoursKnown: Boolean(value?.hoursKnown ?? fallback.hoursKnown),
    isNew: Boolean(value?.isNew ?? fallback.isNew),
  };
}

export function getLocationKnowledge(state: GameState, locationId: LocationId, location?: LocationDefinition): LocationKnowledgeRecord {
  const explicit = state.locationKnowledge?.[locationId];
  const fallback = locationId === "coffee_shop" ? COFFEE_SHOP_INTEL : defaultKnowledge(locationId, location);
  const record = normalizeRecord(explicit, fallback);

  if (state.location === locationId || (locationId === "coffee_shop" && state.metMari)) {
    return {
      ...record,
      state: "visited",
      isNew: false,
      hoursKnown: true,
    };
  }

  return record;
}

export function normalizeLocationKnowledge(state: GameState): Record<LocationId, LocationKnowledgeRecord> {
  const initial = makeInitialLocationKnowledge();
  const source = state.locationKnowledge || {};
  let next: Record<LocationId, LocationKnowledgeRecord> = { ...initial };

  for (const [locationId, record] of Object.entries(source)) {
    next[locationId] = normalizeRecord(record, next[locationId] || defaultKnowledge(locationId));
  }

  if (state.metMari || state.location === "coffee_shop") {
    next.coffee_shop = {
      ...getLocationKnowledge({ ...state, locationKnowledge: next }, "coffee_shop"),
      state: "visited",
      isNew: false,
      hoursKnown: true,
    };
  }

  if (state.location) {
    next[state.location] = {
      ...getLocationKnowledge({ ...state, locationKnowledge: next }, state.location),
      state: "visited",
      isNew: false,
      hoursKnown: true,
    };
  }

  return next;
}

export function isLocationVisible(state: GameState, location: LocationDefinition) {
  return getLocationKnowledge(state, location.id, location).state !== "unknown";
}

export function hasKnownHours(state: GameState, location: LocationDefinition) {
  return Boolean(location.hours && getLocationKnowledge(state, location.id, location).hoursKnown);
}

export function hasNewCompassIntel(state: GameState) {
  return Object.values(state.locationKnowledge || {}).some(record => record.isNew && record.state !== "unknown");
}

export function learnLocation(
  state: GameState,
  locationId: LocationId,
  source: string,
  discoveryState: LocationDiscoveryState = "rumored",
): GameState {
  const current = getLocationKnowledge(state, locationId);
  const nextState = DISCOVERY_RANK[discoveryState] > DISCOVERY_RANK[current.state] ? discoveryState : current.state;

  return {
    ...state,
    locationKnowledge: {
      ...(state.locationKnowledge || {}),
      [locationId]: {
        ...current,
        state: nextState,
        discoveredDay: current.discoveredDay ?? state.day,
        discoveredSlot: current.discoveredSlot ?? state.timeSlot,
        source: current.source || source,
        isNew: current.state === "unknown" ? true : current.isNew,
      },
    },
  };
}

export function visitLocation(state: GameState, locationId: LocationId): GameState {
  const current = getLocationKnowledge(state, locationId);
  return {
    ...state,
    locationKnowledge: {
      ...(state.locationKnowledge || {}),
      [locationId]: {
        ...current,
        state: "visited",
        discoveredDay: current.discoveredDay ?? state.day,
        discoveredSlot: current.discoveredSlot ?? state.timeSlot,
        source: current.source || "Visited in person",
        isNew: false,
        hoursKnown: true,
      },
    },
  };
}
