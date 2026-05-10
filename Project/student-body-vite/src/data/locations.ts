import type { LocationDefinition, LocationId } from "../types/game";

export const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export const TIME_CHUNK_MINUTES = 15;
export const CHUNKS_PER_DAY = 24 * 60 / TIME_CHUNK_MINUTES;
export const DEFAULT_ACTION_CHUNKS = 4;

export function timeChunk(hour: number, minute = 0) {
  if (hour >= 24) return CHUNKS_PER_DAY;
  const totalMinutes = Math.max(0, Math.min(24 * 60 - TIME_CHUNK_MINUTES, hour * 60 + minute));
  return Math.floor(totalMinutes / TIME_CHUNK_MINUTES);
}

export const LEGACY_SLOT_TO_CHUNK = [timeChunk(8), timeChunk(12), timeChunk(15), timeChunk(18), timeChunk(22)];

export function normalizeTimeSlot(slot: number | string | undefined, legacyScale = false) {
  const raw = typeof slot === "number" ? slot : Number(slot);
  if (!Number.isFinite(raw)) return timeChunk(8);
  if (legacyScale && raw >= 0 && raw < LEGACY_SLOT_TO_CHUNK.length) return LEGACY_SLOT_TO_CHUNK[raw];
  return Math.max(0, Math.min(CHUNKS_PER_DAY - 1, Math.round(raw)));
}

export function formatClockTime(slot = 0) {
  const safeSlot = Math.max(0, Math.min(CHUNKS_PER_DAY, Math.round(Number(slot) || 0)));
  const totalMinutes = safeSlot * TIME_CHUNK_MINUTES;
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function getDaypartLabel(slot = 0) {
  const totalMinutes = normalizeTimeSlot(slot) * TIME_CHUNK_MINUTES;
  if (totalMinutes < 5 * 60) return "Late Night";
  if (totalMinutes < 12 * 60) return "Morning";
  if (totalMinutes < 17 * 60) return "Afternoon";
  if (totalMinutes < 21 * 60) return "Evening";
  return "Night";
}

export function formatTimeOfDay(slot = 0) {
  return `${formatClockTime(slot)} (${getDaypartLabel(slot)})`;
}

export function formatDuration(chunks = 0) {
  const minutes = Math.max(0, Math.round(chunks * TIME_CHUNK_MINUTES));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export const TIME_LABELS = Array.from({ length: CHUNKS_PER_DAY }, (_, slot) => formatTimeOfDay(slot));

export const LOCATIONS: Record<LocationId, LocationDefinition> = {
  dorm_room: {
    id: "dorm_room",
    label: "Dorm Room",
    cat: "campus",
    description: "A small first-year dorm room, half-unpacked and always a little too warm.",
  },
  dorm_hallway: {
    id: "dorm_hallway",
    label: "Dorm Hallway",
    cat: "campus",
    description: "A fluorescent dorm corridor with laundry smell, scuffed doors, and passing voices.",
  },
  lecture_hall: {
    id: "lecture_hall",
    label: "Lecture Hall",
    cat: "campus",
    description: "Tiered seats, a projector glow, and the formal hush of a class about to begin.",
  },
  library_main: {
    id: "library_main",
    label: "Library",
    cat: "campus",
    description: "High ceilings, soft light, long tables, and the low murmur of people trying to be productive.",
  },
  library_stacks: {
    id: "library_stacks",
    label: "Upper Stacks",
    cat: "campus",
    description: "Narrow upper-floor stacks where footsteps go quiet and chance encounters feel private.",
  },
  dining_hall: {
    id: "dining_hall",
    label: "Dining Hall",
    cat: "campus",
    description: "Long tables, tray noise, rotating food stations, and little pockets of social weather.",
  },
  quad: {
    id: "quad",
    label: "The Quad",
    cat: "campus",
    description: "The central campus green, crossed by students between buildings and small clusters killing time.",
  },
  quad_night: {
    id: "quad_night",
    label: "Quad (Night)",
    cat: "campus",
    description: "The same green under lamplight, quieter and more exposed, with a different crowd lingering.",
  },
  gym: {
    id: "gym",
    label: "Gym",
    cat: "campus",
    description: "A bright fitness center with rubber floors, machine rhythm, and the smell of work being done.",
  },
  student_union: {
    id: "student_union",
    label: "Student Union",
    cat: "campus",
    description: "Campus's social hub: club flyers, coffee, lounge chairs, and people waiting for plans to form.",
  },
  coffee_shop: {
    id: "coffee_shop",
    label: "Coffee Shop",
    cat: "town",
    description: "A warm independent shop off campus, all old wood, espresso hiss, and regulars with routines.",
    hours: "Daily 7:00 AM-6:00 PM",
    hiddenUntilDiscovered: true,
  },
  bar: {
    id: "bar",
    label: "The Bar",
    cat: "town",
    description: "A dim town bar that gets loud on weekends and tests how much campus life spills past campus.",
  },
  bookstore: {
    id: "bookstore",
    label: "Bookstore",
    cat: "town",
    description: "A small town bookstore with course texts up front and stranger, better shelves in back.",
  },
  restaurant: {
    id: "restaurant",
    label: "Restaurant",
    cat: "town",
    description: "A sit-down town restaurant that feels expensive compared to dining hall math.",
  },
  townie_apartment: {
    id: "townie_apartment",
    label: "Apartment",
    cat: "town",
    description: "Off-campus housing with hand-me-down furniture and the feeling of other people's lives.",
  },
  running_trail: {
    id: "running_trail",
    label: "Running Trail",
    cat: "outdoor",
    description: "A creekside mixed-use path, good for exercise, avoidance, and thinking too much.",
  },
  park: {
    id: "park",
    label: "Park",
    cat: "outdoor",
    description: "A public green space where campus thins into town and nobody quite belongs to either.",
  },
  walking_path: {
    id: "walking_path",
    label: "Walking Path",
    cat: "outdoor",
    description: "A connector path between destinations, more transitional mood than place.",
  },
};
