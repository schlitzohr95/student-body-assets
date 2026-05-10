import type { GameEvent, GameState, TimeSlotIndex } from "../types/game";
import { CHUNKS_PER_DAY, DEFAULT_ACTION_CHUNKS, normalizeTimeSlot, timeChunk } from "../data/locations";
import { makeInitialLocationKnowledge, normalizeLocationKnowledge } from "./locationKnowledge";
import { normalizeRelationships } from "./relationships";

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
      relationships: {
        roommate: {
          score: 4,
          status: "old friend",
          traits: ["shared history"],
          flags: { trust: 2, awkward: 0, texting: true, date_planned: false },
          lastSeenDisposition: "Familiar and friendly.",
          recentMoments: [
            {
              id: "start-roommate-fridge-note",
              day: 1,
              slot: timeChunk(8),
              location: "dorm_room",
              label: "Fridge note",
              text: "Marcus left a casual coffee shop recommendation and a tiny map before heading out.",
              tags: ["intro", "roommate"],
            },
          ],
        },
      },
    },
    narrator: {
      mode: "scripted",
      providerType: "http",
      endpoint: "http://127.0.0.1:8787/narrate",
      model: "",
    },
    npcsKnown: ["roommate"],
    locationKnowledge: makeInitialLocationKnowledge(),
    eventLog: [],
    messages: [],
    notes: [],
    chemistry: {},
    academics: {
      prep: {},
      completedTests: {},
      courses: {},
    },
    calendar: {
      seenReminderIds: [],
    },
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
  const mergedForRelationshipNormalization = {
    ...fresh,
    ...state,
    player: {
      ...fresh.player,
      ...state.player,
    },
  };
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
      relationships: normalizeRelationships(mergedForRelationshipNormalization),
    },
    narrator: {
      mode: state.narrator?.mode || "scripted",
      providerType: state.narrator?.providerType || "http",
      endpoint: state.narrator?.endpoint || "http://127.0.0.1:8787/narrate",
      model: state.narrator?.model || "",
    },
    npcsKnown: [...new Set(["roommate", ...(state.npcsKnown || [])])],
    locationKnowledge: normalizeLocationKnowledge(state),
    eventLog: migrateTimedRecords(state.eventLog, legacyTimeScale),
    messages: migrateTimedRecords(state.messages, legacyTimeScale),
    notes: migrateTimedRecords(state.notes, legacyTimeScale),
    chemistry: state.chemistry || {},
    academics: {
      prep: state.academics?.prep || {},
      completedTests: state.academics?.completedTests || {},
      courses: state.academics?.courses || {},
    },
    calendar: {
      seenReminderIds: state.calendar?.seenReminderIds || [],
    },
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
