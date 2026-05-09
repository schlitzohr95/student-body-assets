import type { GameEvent, GameState, TimeSlotIndex } from "../types/game";
import { CHUNKS_PER_DAY, DEFAULT_ACTION_CHUNKS, normalizeTimeSlot, timeChunk } from "../data/locations";

export function makeFreshState(): GameState {
  return {
    version: 2,
    timeScale: "quarter-hour",
    day: 1,
    timeSlot: timeChunk(8),
    location: "dorm_room",
    introSeen: false,
    metMari: false,
    player: {
      name: "You",
      stats: { knowledge: 30, athletics: 25, charm: 35, sensitivity: 40, grit: 30 },
      resources: { energy: 80, money: 50 },
      traits: [],
      relationships: {},
    },
    npcsKnown: [],
    eventLog: [],
    messages: [],
    notes: [],
  };
}

function migrateTimedRecords<T extends { slot?: number | string }>(records: T[] | undefined, legacyScale: boolean): T[] {
  if (!Array.isArray(records)) return [];
  return records.map(record => {
    if (!record || typeof record.slot !== "number") return record;
    return { ...record, slot: normalizeTimeSlot(record.slot, legacyScale) };
  });
}

export function normalizeState(state: GameState): GameState {
  const fresh = makeFreshState();
  const legacyTimeScale = state.timeScale !== "quarter-hour" && (state.version || 1) < 2;
  return {
    ...fresh,
    ...state,
    version: 2,
    timeScale: "quarter-hour",
    timeSlot: normalizeTimeSlot(state.timeSlot, legacyTimeScale) as TimeSlotIndex,
    player: {
      ...fresh.player,
      ...state.player,
      stats: { ...fresh.player.stats, ...state.player?.stats },
      resources: { ...fresh.player.resources, ...state.player?.resources },
      traits: state.player?.traits || [],
      relationships: state.player?.relationships || {},
    },
    npcsKnown: state.npcsKnown || [],
    eventLog: migrateTimedRecords(state.eventLog, legacyTimeScale),
    messages: migrateTimedRecords(state.messages, legacyTimeScale),
    notes: migrateTimedRecords(state.notes, legacyTimeScale),
  };
}

export function advanceTime(state: GameState, amount = DEFAULT_ACTION_CHUNKS): GameState {
  let day = state.day;
  let slot = normalizeTimeSlot(state.timeSlot) + amount;
  while (slot >= CHUNKS_PER_DAY) {
    slot -= CHUNKS_PER_DAY;
    day += 1;
  }
  while (slot < 0) {
    slot += CHUNKS_PER_DAY;
    day -= 1;
  }

  return { ...state, day, timeSlot: slot as TimeSlotIndex };
}

export function appendEvent(state: GameState, text: string, witnesses: GameEvent["witnesses"] = []): GameState {
  const event: GameEvent = { day: state.day, slot: state.timeSlot, text };
  if (witnesses.length) event.witnesses = witnesses;
  return { ...state, eventLog: [...state.eventLog, event] };
}
