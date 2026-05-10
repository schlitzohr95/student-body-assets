import { STARTER_NPCS } from "../data/npcs";
import { CHUNKS_PER_DAY, formatClockTime } from "../data/locations";
import type { GameMessage, GameState, GameUpdate, NpcId } from "../types/game";

export type PulseTemplateId = "check_in" | "ask_about_day" | "invite_coffee";

const OUTGOING_TEXT: Record<PulseTemplateId, string> = {
  check_in: "Hey. Still alive over there?",
  ask_about_day: "How's your day going?",
  invite_coffee: "Want to grab coffee sometime this week?",
};

const REPLY_TEXT: Record<string, Record<PulseTemplateId, string>> = {
  studious: {
    check_in: "Still alive. Covered in espresso, but alive. You settling in okay?",
    ask_about_day: "Busy. The kind where the clock keeps being rude. Yours?",
    invite_coffee: "Maybe. If you mean actual coffee and not making my shift weird.",
  },
  roommate: {
    check_in: "Yeah, I'm around. What's up?",
    ask_about_day: "Class, food, pretending I know where buildings are. Standard heroic stuff.",
    invite_coffee: "Sure. If Mari is working, act normal for both our sakes.",
  },
};

function absoluteSlot(day: number, slot: number) {
  return (day - 1) * CHUNKS_PER_DAY + slot;
}

function fromAbsoluteSlot(value: number) {
  return {
    day: Math.floor(value / CHUNKS_PER_DAY) + 1,
    slot: value % CHUNKS_PER_DAY,
  };
}

function replyDelay(templateId: PulseTemplateId, npcId: NpcId) {
  if (templateId === "invite_coffee") return npcId === "studious" ? 12 : 6;
  if (templateId === "ask_about_day") return 4;
  return 2;
}

export function outgoingPulseText(templateId: PulseTemplateId) {
  return OUTGOING_TEXT[templateId] || OUTGOING_TEXT.check_in;
}

export function scriptedPulseReply(npcId: NpcId, templateId: PulseTemplateId) {
  return REPLY_TEXT[npcId]?.[templateId] || "Got it. Replying properly when I get a second.";
}

export function visibleMessages(state: GameState, npcId: NpcId): GameMessage[] {
  return state.messages
    .filter(message => message.npcId === npcId && (message.direction === "outgoing" || message.delivered !== false))
    .sort((a, b) => (absoluteSlot(a.day, a.slot) - absoluteSlot(b.day, b.slot)) || a.id.localeCompare(b.id));
}

export function pendingMessages(state: GameState, npcId?: NpcId): GameMessage[] {
  return state.messages.filter(message => message.direction === "incoming" && message.delivered === false && (!npcId || message.npcId === npcId));
}

export function unreadPulseCount(state: GameState, npcId?: NpcId) {
  return state.messages.filter(message =>
    message.direction === "incoming"
    && message.delivered !== false
    && !message.read
    && (!npcId || message.npcId === npcId),
  ).length;
}

export function queuePulseMessage(state: GameState, npcId: NpcId, templateId: PulseTemplateId): { messages: GameMessage[]; replyAt: string } {
  const npc = state.npcDirectory?.[npcId] || STARTER_NPCS[npcId];
  const sendAbsolute = absoluteSlot(state.day, state.timeSlot);
  const replyAt = fromAbsoluteSlot(sendAbsolute + replyDelay(templateId, npcId));
  const suffix = `${state.day}-${state.timeSlot}-${npcId}-${templateId}`;
  const outgoing: GameMessage = {
    id: `${suffix}-out`,
    day: state.day,
    slot: state.timeSlot,
    npcId,
    direction: "outgoing",
    text: outgoingPulseText(templateId),
    read: true,
    delivered: true,
    templateId,
  };
  const incoming: GameMessage = {
    id: `${suffix}-in`,
    day: replyAt.day,
    slot: replyAt.slot,
    availableDay: replyAt.day,
    availableSlot: replyAt.slot,
    npcId,
    direction: "incoming",
    text: scriptedPulseReply(npcId, templateId),
    read: false,
    delivered: false,
    templateId,
  };

  return {
    messages: [outgoing, incoming],
    replyAt: `${npc?.name || npcId} around ${formatClockTime(replyAt.slot)}`,
  };
}

export function deliverDuePulseReplies(state: GameState): GameUpdate {
  const now = absoluteSlot(state.day, state.timeSlot);
  let deliveredName = "";
  const messages = state.messages.map(message => {
    if (message.direction !== "incoming" || message.delivered !== false) return message;
    const available = absoluteSlot(message.availableDay ?? message.day, message.availableSlot ?? message.slot);
    if (available > now) return message;
    if (!deliveredName) deliveredName = state.npcDirectory?.[message.npcId]?.name || STARTER_NPCS[message.npcId]?.name || message.npcId;
    return {
      ...message,
      delivered: true,
      day: state.day,
      slot: state.timeSlot,
    };
  });

  if (!deliveredName) return { state };

  return {
    state: { ...state, messages },
    notification: { app: "Pulse", body: `${deliveredName} replied.` },
  };
}

export function markPulseThreadRead(state: GameState, npcId?: NpcId): GameState {
  return {
    ...state,
    messages: state.messages.map(message =>
      message.direction === "incoming"
      && message.delivered !== false
      && !message.read
      && (!npcId || message.npcId === npcId)
        ? { ...message, read: true }
        : message,
    ),
  };
}
