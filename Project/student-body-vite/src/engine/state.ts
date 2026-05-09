import type { GameEvent, GameState, TimeSlotIndex } from "../types/game";
import { TIME_LABELS } from "../data/locations";

export function makeFreshState(): GameState {
  return {
    version: 1,
    day: 1,
    timeSlot: 1,
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

export function normalizeState(state: GameState): GameState {
  const fresh = makeFreshState();
  return {
    ...fresh,
    ...state,
    player: {
      ...fresh.player,
      ...state.player,
      stats: { ...fresh.player.stats, ...state.player?.stats },
      resources: { ...fresh.player.resources, ...state.player?.resources },
      traits: state.player?.traits || [],
      relationships: state.player?.relationships || {},
    },
    npcsKnown: state.npcsKnown || [],
    eventLog: state.eventLog || [],
    messages: state.messages || [],
    notes: state.notes || [],
  };
}

export function advanceTime(state: GameState, amount = 1): GameState {
  let day = state.day;
  let slot = state.timeSlot + amount;
  while (slot >= TIME_LABELS.length) {
    slot -= TIME_LABELS.length;
    day += 1;
  }

  return { ...state, day, timeSlot: slot as TimeSlotIndex };
}

export function appendEvent(state: GameState, text: string, witnesses: GameEvent["witnesses"] = []): GameState {
  const event: GameEvent = { day: state.day, slot: state.timeSlot, text };
  if (witnesses.length) event.witnesses = witnesses;
  return { ...state, eventLog: [...state.eventLog, event] };
}
