import { CHUNKS_PER_DAY, formatClockTime, formatDuration, timeChunk } from "../data/locations";
import { getCalendarEvents } from "./calendar";
import { appendEvent } from "./state";
import type { GameState, GameUpdate, TimeSlotIndex } from "../types/game";

export interface WakeOption {
  slot: TimeSlotIndex;
  label: string;
  detail: string;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function absoluteSlot(day: number, slot: number) {
  return (day - 1) * CHUNKS_PER_DAY + slot;
}

function fromAbsoluteSlot(value: number) {
  return {
    day: Math.floor(value / CHUNKS_PER_DAY) + 1,
    slot: value % CHUNKS_PER_DAY,
  };
}

export function wakeOptions(): WakeOption[] {
  return [
    { slot: timeChunk(6, 30), label: "6:30 AM", detail: "Early enough for prep, rough if exhausted." },
    { slot: timeChunk(8), label: "8:00 AM", detail: "Default campus morning." },
    { slot: timeChunk(9, 30), label: "9:30 AM", detail: "Safer recovery, can miss early blocks." },
    { slot: timeChunk(11), label: "11:00 AM", detail: "Hard reset. Morning is mostly gone." },
  ];
}

export function sleepPreview(state: GameState, alarmSlot: number) {
  const now = absoluteSlot(state.day, state.timeSlot);
  let target = absoluteSlot(state.day, alarmSlot);
  if (target <= now + 4) target += CHUNKS_PER_DAY;
  const baseDuration = target - now;
  const exhausted = state.player.resources.energy < 20;
  const oversleep = exhausted && baseDuration < 32 ? 8 : 0;
  const finalTarget = target + oversleep;
  const wake = fromAbsoluteSlot(finalTarget);
  const energyGain = Math.min(100 - state.player.resources.energy, 18 + Math.floor((baseDuration + oversleep) * 1.45));
  const missedMorningBlocks = wake.slot > timeChunk(9) ? Math.max(0, wake.slot - timeChunk(8)) : 0;

  return {
    wakeDay: wake.day,
    wakeSlot: wake.slot as TimeSlotIndex,
    durationChunks: baseDuration + oversleep,
    durationLabel: formatDuration(baseDuration + oversleep),
    energyGain,
    exhausted,
    oversleep,
    missedMorningBlocks,
  };
}

function missedCalendarText(state: GameState, startAbsolute: number, endAbsolute: number) {
  return getCalendarEvents(state)
    .filter(event => {
      const eventStart = absoluteSlot(event.day, event.startSlot);
      return eventStart > startAbsolute && eventStart < endAbsolute && event.startSlot < timeChunk(12);
    })
    .map(event => event.title)
    .slice(0, 3);
}

export function sleepUntilAlarm(state: GameState, alarmSlot: number): GameUpdate {
  const preview = sleepPreview(state, alarmSlot);
  const startAbsolute = absoluteSlot(state.day, state.timeSlot);
  const endAbsolute = absoluteSlot(preview.wakeDay, preview.wakeSlot);
  const missedEvents = missedCalendarText(state, startAbsolute, endAbsolute);
  const woke = {
    ...state,
    day: preview.wakeDay,
    timeSlot: preview.wakeSlot,
    player: {
      ...state.player,
      resources: {
        ...state.player.resources,
        energy: clamp(state.player.resources.energy + preview.energyGain),
      },
    },
    wake: {
      alarmSlot: alarmSlot as TimeSlotIndex,
      lastSleepDay: state.day,
      lastSleepSlot: state.timeSlot,
      lastWakeDay: preview.wakeDay,
      lastWakeSlot: preview.wakeSlot,
      missedMorningBlocks: preview.missedMorningBlocks,
    },
  };
  const missedText = missedEvents.length ? ` Missed: ${missedEvents.join(", ")}.` : "";
  const oversleepText = preview.oversleep ? " You slept through the first alarm." : "";
  const next = appendEvent(woke, `Slept ${preview.durationLabel} and woke at ${formatClockTime(preview.wakeSlot)} with +${preview.energyGain} energy.${oversleepText}${missedText}`);

  return {
    state: next,
    notification: {
      app: "Wake",
      body: `Woke at ${formatClockTime(preview.wakeSlot)}. Energy +${preview.energyGain}.${missedEvents.length ? " Morning blocks were missed." : ""}`,
    },
  };
}
