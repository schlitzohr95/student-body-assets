import { STARTER_NPCS } from "../data/npcs";
import { formatCalendarEventTime, getLocationDirectory, getUpcomingCalendarEvents } from "./calendar";
import { getRecentSharedMoments, getRelationshipRecord, relationshipTimeline } from "./relationships";
import type { GameState, NpcId } from "../types/game";

export interface AnthropLead {
  id: string;
  title: string;
  body: string;
  kind: "lead" | "commitment" | "contact" | "moment";
  urgency: "low" | "medium" | "high";
}

function absoluteSlot(day: number, slot: number) {
  return (day - 1) * 96 + slot;
}

function latestContactSlot(state: GameState, npcId: NpcId) {
  const messageSlots = state.messages
    .filter(message => message.npcId === npcId && message.delivered !== false)
    .map(message => absoluteSlot(message.day, message.slot));
  const momentSlots = getRecentSharedMoments(state, npcId, 1).map(moment => absoluteSlot(moment.day, moment.slot));
  return Math.max(0, ...messageSlots, ...momentSlots);
}

export function activeAnthropLeads(state: GameState): AnthropLead[] {
  const locations = getLocationDirectory(state);
  const leads: AnthropLead[] = [];

  if (state.player.traits?.includes("job-curious")) {
    leads.push({
      id: "job-lead",
      title: "Desk Shift Lead",
      body: "You copied a part-time job lead from the Union board. Follow it before it turns into wallpaper.",
      kind: "lead",
      urgency: "medium",
    });
  }

  if (state.player.traits?.includes("study-table-curious")) {
    leads.push({
      id: "study-table",
      title: "SOC Study Table",
      body: "A study table lead is active. It can convert directly into prep before the next SOC test.",
      kind: "lead",
      urgency: "high",
    });
  }

  if (state.locationKnowledge?.coffee_shop?.isNew) {
    leads.push({
      id: "new-coffee-shop",
      title: "New Compass Pin",
      body: "Compass has fresh intel for the Coffee Shop. Visiting locks in the hours and social context.",
      kind: "lead",
      urgency: "medium",
    });
  }

  const currentLocation = locations[state.location];
  if (currentLocation) {
    leads.push({
      id: `current-${state.location}`,
      title: currentLocation.label,
      body: currentLocation.description,
      kind: "lead",
      urgency: "low",
    });
  }

  return leads.slice(0, 5);
}

export function anthropCommitments(state: GameState): AnthropLead[] {
  const upcoming = getUpcomingCalendarEvents(state, 128).slice(0, 4).map(event => ({
    id: `calendar-${event.id}`,
    title: event.title,
    body: `${formatCalendarEventTime(event)}${event.description ? ` · ${event.description}` : ""}`,
    kind: "commitment" as const,
    urgency: event.kind === "test" || event.kind === "deadline" ? "high" as const : "medium" as const,
  }));
  const pinned = state.notes
    .filter(note => note.text.toLowerCase().includes("pinned") || note.links?.category === "event")
    .slice(-3)
    .reverse()
    .map(note => ({
      id: `note-${note.id}`,
      title: note.links?.category === "event" ? "Pinned Event" : "Pinned Note",
      body: note.text,
      kind: "commitment" as const,
      urgency: "medium" as const,
    }));
  const datePlans = Object.entries(state.player.relationships || {})
    .filter(([, record]) => Boolean(record && typeof record === "object" && record.flags?.date_planned))
    .map(([npcId]) => ({
      id: `date-${npcId}`,
      title: `${state.npcDirectory?.[npcId]?.name || STARTER_NPCS[npcId]?.name || npcId} plan`,
      body: "There is a social plan in the air. Follow-through matters more than the flag.",
      kind: "commitment" as const,
      urgency: "medium" as const,
    }));

  return [...upcoming, ...datePlans, ...pinned].slice(0, 8);
}

export function neglectedContacts(state: GameState): AnthropLead[] {
  const now = absoluteSlot(state.day, state.timeSlot);
  return state.npcsKnown
    .filter(npcId => npcId !== "player")
    .map(npcId => {
      const record = getRelationshipRecord(state, npcId);
      const last = latestContactSlot(state, npcId);
      const ageChunks = last ? now - last : 999;
      const name = state.npcDirectory?.[npcId]?.name || STARTER_NPCS[npcId]?.name || npcId;
      return {
        id: `contact-${npcId}`,
        title: name,
        body: ageChunks > 192
          ? "No recent contact. A short Pulse message would keep this from cooling."
          : `${record.status || "Known"} · recently warm enough.`,
        kind: "contact" as const,
        urgency: ageChunks > 192 ? "high" as const : ageChunks > 96 ? "medium" as const : "low" as const,
      };
    })
    .filter(item => item.urgency !== "low")
    .slice(0, 5);
}

export function recentAnthropMoments(state: GameState): AnthropLead[] {
  return state.npcsKnown
    .flatMap(npcId => relationshipTimeline(state, npcId, 3).map(item => ({
      id: `${npcId}-${item.id}`,
      title: state.npcDirectory?.[npcId]?.name || STARTER_NPCS[npcId]?.name || npcId,
      body: `${item.label}: ${item.text}`,
      kind: "moment" as const,
      urgency: "low" as const,
    })))
    .slice(0, 6);
}
