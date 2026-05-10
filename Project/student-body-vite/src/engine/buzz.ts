import { DAY_LABELS, formatClockTime } from "../data/locations";
import { STARTER_NPCS } from "../data/npcs";
import { getCalendarEvents, getLocationDirectory, getUpcomingCalendarEvents } from "./calendar";
import { getRecentSharedMoments } from "./relationships";
import type { GameState, NpcId } from "../types/game";

export interface BuzzPost {
  id: string;
  day: number;
  slot: number;
  author: string;
  source: "scheduled" | "event" | "npc" | "player";
  text: string;
  tag: string;
}

const SCHEDULED_POSTS: BuzzPost[] = [
  { id: "union-open-mic", day: 1, slot: 44, author: "Union Desk", source: "scheduled", tag: "Events", text: "Open mic sign-ups are live at the Student Union desk. Two songs, one poem, or one brave mistake." },
  { id: "library-hours", day: 1, slot: 60, author: "Library", source: "scheduled", tag: "Campus", text: "First-week evening hours are extended. Please pretend the quiet floor sign is legally binding." },
  { id: "intramural-runners", day: 2, slot: 48, author: "Rec Center", source: "scheduled", tag: "Athletics", text: "Intramural teams are still short two runners and one person who owns a clipboard." },
  { id: "bookstore-notebooks", day: 3, slot: 40, author: "Town Bookstore", source: "scheduled", tag: "Town", text: "Used lab notebooks and suspiciously specific bookmarks are discounted this week." },
  { id: "lost-keyring", day: 4, slot: 52, author: "Campus Lost+Found", source: "scheduled", tag: "Notice", text: "A keyring with three keys and one tiny plastic dinosaur was found near the dining hall." },
  { id: "philosophy-flyer", day: 5, slot: 58, author: "Philosophy Club", source: "scheduled", tag: "Club", text: "Tonight's table question: can a sandwich be lonely, or only abandoned?" },
];

const NPC_TEMPLATES: Record<NpcId, Array<(state: GameState) => string>> = {
  studious: [
    state => `Mari would never post it directly, but ${getLocationDirectory(state).coffee_shop?.label || "the coffee shop"} has big "please know your order before the register" energy today.`,
    state => `A barista-adjacent whisper: the best booth for studying is only best if you actually study there.`,
  ],
  roommate: [
    state => `Marcus-level campus wisdom: if a building has three entrances, you will pick the one that is somehow locked.`,
    state => `Dorm dispatch: someone is absolutely microwaving something that used to have structural integrity.`,
  ],
};

function postIsVisible(state: GameState, post: BuzzPost) {
  if (post.day < state.day) return true;
  return post.day === state.day && post.slot <= state.timeSlot;
}

function eventPost(state: GameState): BuzzPost[] {
  const events = getUpcomingCalendarEvents(state, 96).slice(0, 4);
  return events.map(event => ({
    id: `event-${event.id}-${event.day}-${event.startSlot}`,
    day: state.day,
    slot: state.timeSlot,
    author: event.kind === "test" ? "Spark" : "Campus Calendar",
    source: "event" as const,
    tag: event.kind,
    text: `${event.title} ${event.day === state.day ? "today" : `on ${DAY_LABELS[(event.day - 1) % DAY_LABELS.length]}`} at ${formatClockTime(event.startSlot)}.${event.description ? ` ${event.description}` : ""}`,
  }));
}

function npcPosts(state: GameState): BuzzPost[] {
  return state.npcsKnown.flatMap(npcId => {
    const templates = NPC_TEMPLATES[npcId] || [];
    if (!templates.length) return [];
    const index = (state.day + state.timeSlot + npcId.length) % templates.length;
    const moments = getRecentSharedMoments(state, npcId, 1);
    return [{
      id: `npc-${npcId}-${state.day}-${index}`,
      day: state.day,
      slot: state.timeSlot,
      author: state.npcDirectory?.[npcId]?.name || STARTER_NPCS[npcId]?.name || npcId,
      source: "npc" as const,
      tag: moments.length ? "Social" : "Campus",
      text: moments.length ? `${moments[0].label}: ${moments[0].text}` : templates[index](state),
    }];
  });
}

function playerEventPosts(state: GameState): BuzzPost[] {
  return state.eventLog.slice(-3).reverse().map((event, index) => ({
    id: `player-${event.day || state.day}-${event.slot || 0}-${index}`,
    day: event.day || state.day,
    slot: Number(event.slot ?? event.timeSlot ?? 0),
    author: "Your orbit",
    source: "player" as const,
    tag: "Footprint",
    text: event.text || event.summary || event.label || "Something shifted in your week.",
  }));
}

export function getBuzzPosts(state: GameState): BuzzPost[] {
  const scheduled = SCHEDULED_POSTS.filter(post => postIsVisible(state, post)).slice(-5);
  const eventIds = new Set(getCalendarEvents(state).map(event => event.id));
  return [
    ...eventPost(state),
    ...npcPosts(state),
    ...scheduled,
    ...playerEventPosts(state).filter(post => !eventIds.has(post.id)),
  ]
    .filter((post, index, all) => all.findIndex(item => item.id === post.id) === index)
    .sort((a, b) => (b.day - a.day) || (b.slot - a.slot))
    .slice(0, 12);
}

export function buzzSourceLabel(post: BuzzPost) {
  if (post.source === "event") return "Calendar";
  if (post.source === "npc") return "People";
  if (post.source === "player") return "You";
  return "Campus";
}
