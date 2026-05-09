import { DAY_LABELS, TIME_LABELS } from "../data/locations";
import type { GameEvent, GameNote } from "../types/game";

export function formatMoment(day = 1, slot: number | string = 0) {
  const week = Math.floor((day - 1) / 7) + 1;
  const dayName = DAY_LABELS[(day - 1) % DAY_LABELS.length];
  const slotLabel = typeof slot === "number" ? TIME_LABELS[slot] || `Slot ${slot}` : slot;
  return `W${week} ${dayName} ${slotLabel}`;
}

export function eventSummary(event: GameEvent) {
  return event.text || event.summary || event.event_summary || event.label || event.kind || "Untitled event";
}

export function noteMoment(note: GameNote) {
  return formatMoment(note.day, note.slot);
}
