import type { LocationDefinition, LocationId } from "../types/game";

export const TIME_LABELS = ["Morning", "Midday", "Afternoon", "Evening", "Night"] as const;
export const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

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
