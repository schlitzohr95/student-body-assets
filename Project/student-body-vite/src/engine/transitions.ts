import type { Choice, GameMessage, GameNote, GameState, GameUpdate, LocationId, NpcId, StatKey } from "../types/game";
import { DEFAULT_ACTION_CHUNKS, formatDuration, LOCATIONS } from "../data/locations";
import { STARTER_NPCS } from "../data/npcs";
import { advanceTime, appendEvent } from "./state";

const messageResponses: Record<string, string> = {
  check_in: "Hey. Still alive over there?",
  ask_about_day: "How's your day going?",
  invite_coffee: "Want to grab coffee sometime this week?",
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function changeStats(state: GameState, changes: Partial<Record<StatKey, number>>): GameState {
  const stats = { ...state.player.stats };
  for (const [stat, delta] of Object.entries(changes) as Array<[StatKey, number]>) {
    stats[stat] = clamp(stats[stat] + delta);
  }
  return { ...state, player: { ...state.player, stats } };
}

function changeResources(state: GameState, changes: Partial<Record<"energy" | "money", number>>): GameState {
  const resources = { ...state.player.resources };
  if (typeof changes.energy === "number") resources.energy = clamp(resources.energy + changes.energy);
  if (typeof changes.money === "number") resources.money = Math.max(0, resources.money + changes.money);
  return { ...state, player: { ...state.player, resources } };
}

function changeRelationship(state: GameState, npcId: NpcId, delta: number, status?: string): GameState {
  const current = state.player.relationships?.[npcId];
  const currentScore = typeof current === "object" && current ? Number(current.score) || 0 : typeof current === "number" ? current : 0;
  const currentRecord = typeof current === "object" && current ? current : undefined;

  return {
    ...state,
    player: {
      ...state.player,
      relationships: {
        ...(state.player.relationships || {}),
        [npcId]: {
          ...(currentRecord || {}),
          score: currentScore + delta,
          status: status || (typeof currentRecord?.status === "string" ? currentRecord.status : "developing"),
        },
      },
    },
  };
}

function addTrait(state: GameState, trait: string): GameState {
  const traits = state.player.traits || [];
  if (traits.includes(trait)) return state;
  return { ...state, player: { ...state.player, traits: [...traits, trait] } };
}

function applyActivityOutcome(state: GameState, choice: Choice): GameUpdate {
  let next = state;
  let notification: GameUpdate["notification"];

  switch (choice.id) {
    case "study_deep":
      next = changeResources(changeStats(next, { knowledge: 4, grit: 1 }), { energy: -8 });
      next = appendEvent(next, "Studied seriously at the library.");
      break;
    case "browse_stacks":
      next = changeStats(next, { knowledge: 2, sensitivity: 1 });
      next = appendEvent(next, "Wandered the library stacks and found a few promising books.");
      break;
    case "workout_weights":
      next = changeResources(changeStats(next, { athletics: 4, grit: 2 }), { energy: -12 });
      next = appendEvent(next, "Lifted weights at the gym.");
      break;
    case "workout_cardio":
      next = changeResources(changeStats(next, { athletics: 3, grit: 1 }), { energy: -10 });
      next = appendEvent(next, "Put in a cardio session at the gym.");
      break;
    case "trail_run":
      next = changeResources(changeStats(next, { athletics: 3, grit: 1 }), { energy: -9 });
      next = appendEvent(next, "Ran the creekside trail.");
      break;
    case "trail_walk":
      next = changeStats(next, { sensitivity: 2, grit: 1 });
      next = appendEvent(next, "Took a long walk on the running trail.");
      break;
    case "browse_flyers":
      next = addTrait(changeStats(next, { charm: 1, knowledge: 1 }), "campus-curious");
      next = appendEvent(next, "Browsed the student union flyer board.");
      notification = { app: "Buzz", body: "A few campus events caught your eye." };
      break;
    case "people_watch":
      next = changeStats(next, { sensitivity: 2, charm: 1 });
      next = appendEvent(next, "People-watched in the student union.");
      break;
    case "eat_meal":
      next = changeResources(next, { energy: 14, money: -4 });
      next = appendEvent(next, "Ate a real meal at the dining hall.");
      break;
    case "sit_with_strangers":
      next = changeResources(changeStats(next, { charm: 2 }), { energy: 6 });
      next = appendEvent(next, "Sat near a busy table and made a little small talk.");
      break;
    case "browse_books":
      next = changeStats(next, { knowledge: 2, sensitivity: 1 });
      next = appendEvent(next, "Browsed the back shelves at the bookstore.");
      break;
    case "buy_supplies":
      next = changeResources(changeStats(next, { grit: 1 }), { money: -8 });
      next = appendEvent(next, "Bought basic school supplies.");
      break;
    case "review_notes":
      next = changeResources(changeStats(next, { knowledge: 3, grit: 1 }), { energy: -5 });
      next = appendEvent(next, "Reviewed class notes in the dorm room.");
      break;
    case "tidy_room":
      next = changeResources(changeStats(next, { grit: 1 }), { energy: -3 });
      next = appendEvent(next, "Put the dorm room in better order.");
      break;
    case "sit_window":
      next = changeResources(changeStats(next, { knowledge: 2 }), { energy: 2, money: -3 });
      next = appendEvent(next, "Studied for a while in the coffee shop window booth.");
      break;
    case "chat_counter":
      next = changeStats(next, { charm: 2, sensitivity: 1 });
      next = changeRelationship(next, "studious", 1, "friendly");
      next = appendEvent(next, "Chatted with Mari at the coffee shop counter.", ["studious"]);
      break;
    case "leave":
      next = appendEvent(next, "Decided not to linger.");
      break;
    default:
      return { state: next };
  }

  return { state: next, notification };
}

function getChoiceDurationChunks(choice: Choice) {
  const durations: Record<string, number> = {
    go_coffee: 2,
    explore: 4,
    unpack: 6,
    study_deep: 6,
    browse_stacks: 4,
    workout_weights: 6,
    workout_cardio: 5,
    trail_run: 4,
    trail_walk: 4,
    browse_flyers: 2,
    people_watch: 4,
    eat_meal: 3,
    sit_with_strangers: 4,
    browse_books: 4,
    buy_supplies: 2,
    review_notes: 6,
    tidy_room: 4,
    sit_window: 6,
    chat_counter: 3,
    rest: 8,
    wait: 4,
    leave: 1,
  };
  return durations[choice.id] || DEFAULT_ACTION_CHUNKS;
}

function getTravelDurationChunks(fromLocation: LocationId, toLocation: LocationId) {
  if (!fromLocation || !toLocation || fromLocation === toLocation) return 0;
  const fromCat = LOCATIONS[fromLocation]?.cat;
  const toCat = LOCATIONS[toLocation]?.cat;
  if (fromCat === "campus" && toCat === "campus") return 1;
  if (fromCat === toCat) return 2;
  if ((fromCat === "campus" && toCat === "town") || (fromCat === "town" && toCat === "campus")) return 2;
  return 3;
}

export function navigateToLocation(state: GameState, locationKey: LocationId): GameUpdate {
  if (state.location === locationKey) return { state };

  const destination = LOCATIONS[locationKey]?.label || locationKey;
  const travelChunks = getTravelDurationChunks(state.location, locationKey);
  const next = advanceTime(appendEvent(state, `Walked to ${destination} (${formatDuration(travelChunks)})`), travelChunks);
  return { state: { ...next, location: locationKey } };
}

export function applyChoice(state: GameState, choice: Choice): GameUpdate {
  let next = advanceTime(appendEvent(state, `Chose: ${choice.label}`), getChoiceDurationChunks(choice));
  let notification: GameUpdate["notification"];

  if (choice.tag === "intro_complete") next = { ...next, introSeen: true };

  if (choice.tag === "met_mari" || choice.tag === "met_mari_quiet") {
    next = appendEvent(next, "Met Mari at the coffee shop.", ["studious"]);
    next = {
      ...next,
      metMari: true,
      npcsKnown: next.npcsKnown.includes("studious") ? next.npcsKnown : [...next.npcsKnown, "studious"],
      player: {
        ...next.player,
        relationships: {
          ...(next.player.relationships || {}),
          studious: { score: 1, status: "met", lastSeenDisposition: "Professionally warm and curious." },
        },
      },
    };
    notification = { app: "Pulse", body: "Mari saved your number." };
  }

  if (choice.id === "go_coffee") next = { ...next, location: "coffee_shop" };
  if (choice.id === "explore") next = { ...next, location: "quad" };

  if (choice.id === "rest" || choice.id === "wait") {
    next = {
      ...next,
      player: {
        ...next.player,
        resources: {
          ...next.player.resources,
          energy: Math.min(100, next.player.resources.energy + 8),
        },
      },
    };
  }

  const activityUpdate = applyActivityOutcome(next, choice);
  next = activityUpdate.state;
  notification = activityUpdate.notification || notification;

  return { state: next, notification };
}

export function sendPulseMessage(state: GameState, npcId: NpcId, templateId: keyof typeof messageResponses): GameUpdate {
  const npc = state.npcDirectory?.[npcId] || STARTER_NPCS[npcId];
  const text = messageResponses[templateId] || messageResponses.check_in;
  const outgoing: GameMessage = {
    id: `${state.day}-${state.timeSlot}-${npcId}-${templateId}-out`,
    day: state.day,
    slot: state.timeSlot,
    npcId,
    direction: "outgoing",
    text,
    read: true,
  };
  const incoming: GameMessage = {
    id: `${state.day}-${state.timeSlot}-${npcId}-${templateId}-in`,
    day: state.day,
    slot: state.timeSlot,
    npcId,
    direction: "incoming",
    text: npc?.name === "Mari" ? "Not bad. Busy, but that's normal. You settling in okay?" : "Yeah, I'm around. What's up?",
    read: false,
  };

  let next = appendEvent(
    {
      ...state,
      messages: [...state.messages, outgoing, incoming],
    },
    `Texted ${npc?.name || npcId}: ${text}`,
    [npcId],
  );
  next = changeRelationship(next, npcId, templateId === "invite_coffee" ? 2 : 1, "texting");

  return {
    state: next,
    notification: { app: "Pulse", body: `${npc?.name || npcId} replied.` },
  };
}

export function addMarginNote(state: GameState, text: string): GameUpdate {
  const trimmed = text.trim();
  if (!trimmed) return { state };

  const note: GameNote = {
    id: `${state.day}-${state.timeSlot}-${Date.now()}`,
    day: state.day,
    slot: state.timeSlot,
    text: trimmed,
  };

  return {
    state: {
      ...appendEvent(state, "Added a note in Margin."),
      notes: [...state.notes, note],
    },
  };
}
