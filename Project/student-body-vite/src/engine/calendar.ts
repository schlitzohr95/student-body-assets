import { BASE_CALENDAR_EVENTS } from "../data/calendar";
import { DAY_LABELS, LOCATIONS, formatClockTime, normalizeTimeSlot, timeChunk } from "../data/locations";
import { STARTER_NPCS } from "../data/npcs";
import type { CalendarEvent, GameState, GameUpdate, LocationDefinition, Npc, NpcId, NpcScheduleBlock } from "../types/game";
import { getAcademicTests } from "./academics";
import { normalizeLocationMap, normalizeNpcMap } from "./worldPacks";

const REMINDER_WINDOW_CHUNKS = 16;
const CHUNKS_PER_DAY_FOR_CALENDAR = 96;

const STATIC_NPC_SCHEDULES: Record<NpcId, Record<string, NpcScheduleBlock[]>> = {
  studious: {
    daily: [
      { start: "07:00", end: "15:30", location: "coffee_shop", mood: "working the counter" },
    ],
    friday: [
      { start: "19:00", end: "21:00", location: "bookstore", mood: "browsing after work" },
    ],
  },
  roommate: {
    weekday: [
      { start: "07:00", end: "08:30", location: "dorm_room", mood: "getting ready" },
      { start: "10:00", end: "11:15", location: "lecture_hall", mood: "in class" },
      { start: "12:00", end: "13:00", location: "dining_hall", mood: "grabbing food" },
      { start: "20:00", end: "23:00", location: "dorm_room", mood: "settling in" },
    ],
    weekend: [
      { start: "10:00", end: "12:00", location: "dorm_room", mood: "slow morning" },
      { start: "14:00", end: "17:00", location: "student_union", mood: "floating between plans" },
      { start: "20:00", end: "23:00", location: "dorm_room", mood: "around the room" },
    ],
  },
};

function dayName(day: number) {
  return DAY_LABELS[(Math.max(1, day) - 1) % DAY_LABELS.length].toLowerCase();
}

function dayGroup(day: number) {
  const name = dayName(day);
  return name === "saturday" || name === "sunday" ? "weekend" : "weekday";
}

function absoluteSlot(day: number, slot: number) {
  return (day - 1) * CHUNKS_PER_DAY_FOR_CALENDAR + slot;
}

export function parseScheduleSlot(value: string | number | undefined, fallback = 0) {
  if (typeof value === "number") return normalizeTimeSlot(value);
  if (!value) return fallback;
  const [rawHour, rawMinute = "0"] = value.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (!Number.isFinite(hour)) return fallback;
  return timeChunk(hour, Number.isFinite(minute) ? minute : 0);
}

function eventKey(event: CalendarEvent) {
  return `${event.id}:${event.day}:${event.startSlot}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeScheduleBlock(value: unknown): NpcScheduleBlock | null {
  if (!isRecord(value)) return null;
  const location = typeof value.location === "string" ? value.location : undefined;
  if (!location) return null;
  return {
    start: typeof value.start === "string" || typeof value.start === "number" ? value.start : "08:00",
    end: typeof value.end === "string" || typeof value.end === "number" ? value.end : undefined,
    location,
    mood: typeof value.mood === "string" ? value.mood : undefined,
    label: typeof value.label === "string" ? value.label : undefined,
    days: Array.isArray(value.days) ? value.days as Array<string | number> : undefined,
    source: typeof value.source === "string" ? value.source : undefined,
  };
}

function dayMatches(block: NpcScheduleBlock, bucket: string, day: number) {
  if (!block.days?.length) return true;
  const name = dayName(day);
  return block.days.some(item => {
    if (typeof item === "number") return item === day;
    const normalized = item.toLowerCase();
    return normalized === name || normalized === bucket || normalized === "daily" || normalized === `day${day}`;
  });
}

function flattenScheduleSource(source: unknown, day: number): NpcScheduleBlock[] {
  const bucket = dayGroup(day);
  const name = dayName(day);

  if (Array.isArray(source)) {
    return source.map(normalizeScheduleBlock).filter(Boolean) as NpcScheduleBlock[];
  }

  if (!isRecord(source)) return [];

  const blocks: NpcScheduleBlock[] = [];
  for (const [key, rawValue] of Object.entries(source)) {
    const normalizedKey = key.toLowerCase();
    const keyMatches = normalizedKey === "daily" || normalizedKey === bucket || normalizedKey === name || normalizedKey === `day${day}`;
    if (!keyMatches && normalizedKey !== "default") continue;

    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) {
      const block = normalizeScheduleBlock(value);
      if (block && dayMatches(block, bucket, day)) blocks.push({ ...block, source: block.source || key });
    }
  }

  return blocks;
}

function activeScheduleBlock(blocks: NpcScheduleBlock[], slot: number) {
  return blocks.find(block => {
    const start = parseScheduleSlot(block.start, 0);
    const end = parseScheduleSlot(block.end, start + 4);
    return slot >= start && slot < end;
  }) || null;
}

function worldNpcScheduleSource(state: GameState, npcId: NpcId) {
  return state.world?.npcSchedules?.[npcId] ?? state.world?.schedules?.[npcId];
}

export function getNpcDirectory(state: GameState): Record<NpcId, Npc> {
  return {
    ...STARTER_NPCS,
    ...normalizeNpcMap(state.world?.npcs),
    ...normalizeNpcMap(state.world?.characters),
    ...(state.npcDirectory || {}),
  };
}

export function getLocationDirectory(state: GameState): Record<string, LocationDefinition> {
  return {
    ...LOCATIONS,
    ...normalizeLocationMap(state.world?.locations),
  };
}

export function getNpcScheduleBlocks(state: GameState, npcId: NpcId): NpcScheduleBlock[] {
  return [
    ...flattenScheduleSource(STATIC_NPC_SCHEDULES[npcId], state.day),
    ...flattenScheduleSource(worldNpcScheduleSource(state, npcId), state.day),
  ];
}

export function resolveScheduledNpc(state: GameState, npc: Npc): Npc {
  const block = activeScheduleBlock(getNpcScheduleBlocks(state, npc.id), state.timeSlot);
  if (!block) return npc;
  return {
    ...npc,
    currentLocation: block.location,
    currentMood: block.mood || block.label || npc.currentMood,
  };
}

export function getScheduledNpcDirectory(state: GameState): Record<NpcId, Npc> {
  const directory = getNpcDirectory(state);
  return Object.fromEntries(Object.entries(directory).map(([id, npc]) => [id, resolveScheduledNpc(state, npc)]));
}

export function getNpcsAtLocation(state: GameState, locationId: string): Npc[] {
  return Object.values(getScheduledNpcDirectory(state))
    .filter(npc => (npc.currentLocation || npc.location) === locationId)
    .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
}

function normalizeWorldCalendarEvents(state: GameState): CalendarEvent[] {
  return (state.world?.calendarEvents || [])
    .filter(event => event && typeof event.id === "string" && typeof event.day === "number" && typeof event.startSlot === "number")
    .map(event => ({
      ...event,
      startSlot: normalizeTimeSlot(event.startSlot),
      endSlot: typeof event.endSlot === "number" ? normalizeTimeSlot(event.endSlot) : undefined,
      source: event.source || "world-pack",
    }));
}

function academicTestCalendarEvents(state: GameState): CalendarEvent[] {
  return getAcademicTests(state).map(test => ({
    id: `test_${test.id}`,
    title: `${test.courseTitle}: ${test.label}`,
    kind: "test" as const,
    day: test.day,
    startSlot: test.startSlot ?? timeChunk(10),
    endSlot: test.endSlot ?? timeChunk(11),
    location: test.location,
    courseId: test.courseId,
    testId: test.id,
    source: "academics",
    description: "Academic test. Prep affects hints, question count, difficulty, and grade curve.",
  }));
}

export function getCalendarEvents(state: GameState): CalendarEvent[] {
  return [
    ...BASE_CALENDAR_EVENTS,
    ...academicTestCalendarEvents(state),
    ...normalizeWorldCalendarEvents(state),
  ].sort((a, b) => (a.day - b.day) || (a.startSlot - b.startSlot) || a.title.localeCompare(b.title));
}

export function getUpcomingCalendarEvents(state: GameState, windowChunks = 96): CalendarEvent[] {
  const now = absoluteSlot(state.day, state.timeSlot);
  return getCalendarEvents(state)
    .filter(event => {
      const when = absoluteSlot(event.day, event.startSlot);
      return when >= now && when <= now + windowChunks;
    })
    .slice(0, 6);
}

export function formatCalendarEventTime(event: CalendarEvent) {
  const week = Math.floor((event.day - 1) / 7) + 1;
  const dayLabel = DAY_LABELS[(event.day - 1) % DAY_LABELS.length];
  const end = typeof event.endSlot === "number" ? `-${formatClockTime(event.endSlot)}` : "";
  return `W${week} ${dayLabel} ${formatClockTime(event.startSlot)}${end}`;
}

export function maybeIssueCalendarReminder(state: GameState): GameUpdate {
  const now = absoluteSlot(state.day, state.timeSlot);
  const active = getCalendarEvents(state)
    .find(event => {
      if (event.kind !== "test" && event.kind !== "class") return false;
      const start = absoluteSlot(event.day, event.startSlot);
      const end = absoluteSlot(event.day, event.endSlot ?? event.startSlot + 4);
      return now >= start && now < end;
    });
  const upcoming = active || getUpcomingCalendarEvents(state, REMINDER_WINDOW_CHUNKS)
    .find(event => event.kind === "test" || event.kind === "deadline" || event.kind === "class");
  if (!upcoming) return { state };

  const reminderId = `${active ? "active" : "upcoming"}:${eventKey(upcoming)}`;
  const seen = state.calendar?.seenReminderIds || [];
  if (seen.includes(reminderId)) return { state };

  return {
    state: {
      ...state,
      calendar: {
        seenReminderIds: [...seen, reminderId],
      },
    },
    notification: {
      app: upcoming.kind === "test" ? "Spark" : "Anthrop",
      body: active ? `${upcoming.title} starts now.` : `${upcoming.title} at ${formatClockTime(upcoming.startSlot)}.`,
    },
  };
}
