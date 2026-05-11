import type { Choice, DialogueTurn, DialogueTurnSource, GameState, LocationId } from "../types/game";
import { getLocationDirectory } from "./calendar";

const DIALOGUE_LOG_LIMIT = 18;

type DialogueTurnDraft = Omit<DialogueTurn, "id" | "day" | "slot" | "label"> & Partial<Pick<DialogueTurn, "id" | "day" | "slot" | "label">>;

function cleanChoiceLabel(label: string) {
  return label.trim().replace(/^"(.+)"$/, "$1");
}

function turnLabel(turn: DialogueTurnDraft) {
  if (turn.label) return turn.label;
  if (turn.speaker === "player") return "You";
  return turn.npcId || "Narrator";
}

function turnId(state: GameState, turn: DialogueTurnDraft) {
  const index = state.dialogueLog?.length || 0;
  const safeSource = turn.source || turn.speaker;
  return `${turn.day ?? state.day}-${turn.slot ?? state.timeSlot}-${safeSource}-${index}`;
}

export function appendDialogueTurn(state: GameState, turn: DialogueTurnDraft): GameState {
  const text = turn.text.trim();
  if (!text) return state;

  const nextTurn: DialogueTurn = {
    id: turn.id || turnId(state, turn),
    day: turn.day ?? state.day,
    slot: turn.slot ?? state.timeSlot,
    speaker: turn.speaker,
    label: turnLabel(turn),
    text,
    source: turn.source,
    npcId: turn.npcId,
  };

  return {
    ...state,
    dialogueLog: [...(state.dialogueLog || []), nextTurn].slice(-DIALOGUE_LOG_LIMIT),
  };
}

export function appendPlayerChoiceTurn(state: GameState, choice: Choice, at: Pick<GameState, "day" | "timeSlot">): GameState {
  return appendDialogueTurn(state, {
    speaker: "player",
    label: "You",
    text: cleanChoiceLabel(choice.label),
    source: "choice",
    day: at.day,
    slot: at.timeSlot,
  });
}

export function appendNarratorTurn(
  state: GameState,
  text: string,
  source: DialogueTurnSource = "scripted",
  at: Pick<GameState, "day" | "timeSlot"> = state,
): GameState {
  return appendDialogueTurn(state, {
    speaker: "narrator",
    label: "Narrator",
    text,
    source,
    day: at.day,
    slot: at.timeSlot,
  });
}

export function appendChoiceTranscript(
  before: GameState,
  after: GameState,
  choice: Choice,
  responseText: string,
  source: DialogueTurnSource = "scripted",
): GameState {
  const withPlayer = appendPlayerChoiceTurn(after, choice, before);
  return appendNarratorTurn(withPlayer, responseText, source, after);
}

export function appendNavigationArrivalTurn(before: GameState, after: GameState, locationId: LocationId): GameState {
  if (before.location === after.location) return after;
  return appendNarratorTurn(after, navigationArrivalText(after, locationId), "navigation", after);
}

function locationLabel(state: GameState) {
  return getLocationDirectory(state)[state.location]?.label || state.location;
}

function navigationArrivalText(state: GameState, locationId: LocationId) {
  const location = getLocationDirectory(state)[locationId];
  if (!location) return "You arrive, take in the edges of the place, and let the day catch up around you.";
  return `You arrive at ${location.label}. ${location.description}`;
}

export function scriptedResponseForChoice(before: GameState, choice: Choice, after: GameState): string {
  const here = locationLabel(after);

  if (choice.id.startsWith("bulletin_event_") || choice.id.startsWith("bulletin_pack_")) {
    return `You save the lead from the bulletin board. It lands in your notes as something real enough to follow up on later.`;
  }

  switch (choice.id) {
    case "go_coffee":
      return "You follow Marcus's tiny map off campus. By the time the coffee shop bell rings overhead, the town already feels close enough to complicate the morning.";
    case "unpack":
      return "You stay with the boxes long enough to make the room feel less temporary. Campus waits outside, but at least your side of the room stops looking like a warning.";
    case "explore":
      return "You drift out through campus and let the paths introduce themselves. The quad gives you names without context, faces without stories, and a little more sense of the place.";
    case "order_drip":
      return "\"Drip is honest,\" Mari says, ringing it up without ceremony. Her eyes flick to your face, then to the door, like she is placing you in a story she has only partly heard.";
    case "order_fancy":
      return "Mari gives you a quick, appraising smile and makes something warmer and more complicated than you meant to buy. \"Ambitious for a first order,\" she says, not unkindly.";
    case "look_around":
      return "You pretend to study the menu while learning the room instead: regulars by the window, a tiny staff rhythm behind the counter, Mari noticing that you are noticing.";
    case "sit_window":
      return "You take the window booth and let coffee turn into a study ritual. The work goes better with street noise on the other side of the glass.";
    case "chat_counter":
      return "Mari lets the counter conversation stretch past the purely professional. She is still working, still careful, but the warmth under her dry timing gets easier to hear.";
    case "buy_pastry":
      return "You buy the pastry and tuck it away like a future favor to yourself. Mari slides the bag over with the solemnity of someone who knows late-day hunger is real.";
    case "ask_mari_about_marcus":
      return "Mari pauses just long enough for the question to become visible between you. \"Marcus knows a lot of people,\" she says, then softens it with a look that admits that is not the whole answer.";
    case "ask_marcus_about_mari":
      return "Marcus tries for casual and misses by half a second. \"Mari? She's good people,\" he says, then busies himself with something on his desk that does not need busying.";
    case "suggest_after_shift":
      return "Mari does not answer quickly, which makes the answer matter more. \"Maybe,\" she says. \"After close, if you still know how to be normal by then.\"";
    case "study_deep":
      return "You put your head down and do the unglamorous part of becoming sharper. The notes start connecting, one stubborn piece at a time.";
    case "browse_stacks":
      return "The stacks reward wandering. You find a few titles that feel like side doors into class, and one margin note from a stranger that makes you pause.";
    case "workout_weights":
      return "The weights do not care how your week is going. Rep by rep, the room narrows to breath, form, and the relief of measurable effort.";
    case "workout_cardio":
      return "The cardio machines turn time into numbers. It is not glamorous, but your thoughts come out cleaner on the other side.";
    case "trail_run":
      return "You run until campus loosens its grip. By the creek, effort becomes simpler than whatever you were avoiding.";
    case "trail_walk":
      return "You walk the trail slowly enough for details to catch up: water noise, passing shoes, the strange privacy of being outside with a crowded head.";
    case "browse_flyers":
      return "The bulletin board is a messy map of other people's momentum. A few flyers snag in your mind as possible futures.";
    case "people_watch":
      return "You sit where nobody needs anything from you and let the room teach. Groups form, split, flirt, posture, and reveal more than they mean to.";
    case "eat_meal":
      return "A real meal steadies the day more than you expected. For a few minutes, the semester becomes a tray, a chair, and enough food.";
    case "sit_with_strangers":
      return "The table conversation opens just enough to let you in. Nothing dramatic happens, which is part of why it helps.";
    case "browse_books":
      return "You wander past the obvious shelves and find the stranger, better ones in back. The bookstore starts to feel like a place with opinions.";
    case "buy_supplies":
      return "You buy the practical things and feel, briefly, like someone who might keep up with their own life.";
    case "buy_snack_pack":
      return "You buy the snack pack with the private confidence of someone making one small future problem easier.";
    case "review_notes":
      return "You sit with your notes until the lecture stops being a blur and starts becoming something you could explain back.";
    case "tidy_room":
      return "You put the room in order one small decision at a time. It is not transformation, but it is traction.";
    case "work_union_shift":
      return "The desk shift turns out to be mostly questions, directions, and learning how campus sounds when you have to be useful in it.";
    case "work_bookstore_shift":
      return "The shelving shift is quiet, exacting work. By the end, your hands know more about the store than your map does.";
    case "look_around_location":
      return `You slow down and actually read ${here}: exits, corners, rhythms, who belongs here easily and who has to perform it.`;
    case "rest":
      return "You give the day permission to stop pulling on you for a while. Rest does not solve everything, but it gives you back enough to continue.";
    case "wait":
      return `You spend a little time at ${here}. Nothing announces itself as important, but the day still shifts around you.`;
    case "leave":
      return "You decide not to linger. Sometimes leaving before a moment curdles is its own kind of social skill.";
    default:
      return `The choice lands, and ${here} keeps moving around you. The semester absorbs the moment and offers the next one.`;
  }
}
