import type { Choice, GameNote, GameState, GameUpdate, LocationId, NpcId, StatKey } from "../types/game";
import { DEFAULT_ACTION_CHUNKS } from "../data/locations";
import { STARTER_NPCS } from "../data/npcs";
import { advanceTime, appendEvent } from "./state";
import { updateRoommateStudiousChemistry } from "./chemistry";
import { addAcademicPrep } from "./academics";
import { getLocationDirectory, maybeIssueCalendarReminder } from "./calendar";
import { learnLocation, visitLocation } from "./locationKnowledge";
import { deliverDuePulseReplies, outgoingPulseText, queuePulseMessage, type PulseTemplateId } from "./pulse";
import { addSharedMoment, addSharedMomentForMany, getRelationshipFlag, updateRelationship } from "./relationships";
import { getTravelPlan } from "./travel";

function withCalendarReminder(update: GameUpdate): GameUpdate {
  const pulse = deliverDuePulseReplies(update.state);
  const reminder = maybeIssueCalendarReminder(pulse.state);
  return {
    state: reminder.state,
    notification: update.notification || pulse.notification || reminder.notification,
  };
}

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

function addTrait(state: GameState, trait: string): GameState {
  const traits = state.player.traits || [];
  if (traits.includes(trait)) return state;
  return { ...state, player: { ...state.player, traits: [...traits, trait] } };
}

function currentLocationLabel(state: GameState) {
  return getLocationDirectory(state)[state.location]?.label || state.location;
}

function applyActivityOutcome(state: GameState, choice: Choice): GameUpdate {
  let next = state;
  let notification: GameUpdate["notification"];

  if (choice.id.startsWith("bulletin_event_")) {
    const note: GameNote = {
      id: `${state.day}-${state.timeSlot}-${choice.id}`,
      day: state.day,
      slot: state.timeSlot,
      text: `Pinned from the Student Union board: ${choice.label}`,
    };
    next = appendEvent({ ...next, notes: [...next.notes, note] }, `Pinned a Student Union bulletin: ${choice.label}.`);
    return { state: next, notification: { app: "Anthrop", body: "Pinned to Margin as a commitment." } };
  }

  switch (choice.id) {
    case "study_deep":
      next = changeResources(changeStats(next, { knowledge: 4, grit: 1 }), { energy: -8 });
      next = addAcademicPrep(next, "soc101", { studyChunks: 6, focus: 3 });
      next = appendEvent(next, "Studied seriously at the library.");
      break;
    case "browse_stacks":
      next = changeStats(next, { knowledge: 2, sensitivity: 1 });
      next = addAcademicPrep(next, "soc101", { studyChunks: 2, focus: 1 });
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
    case "bulletin_study_group":
      next = addAcademicPrep(addTrait(changeStats(next, { knowledge: 1, grit: 1 }), "study-table-curious"), "soc101", { studyChunks: 2, focus: 1 });
      next = appendEvent(next, "Saved a SOC 101 study table from the Student Union bulletin board.");
      notification = { app: "Spark", body: "Study table lead saved." };
      break;
    case "bulletin_club_fair":
      next = addTrait(changeStats(next, { charm: 1, sensitivity: 1 }), "club-curious");
      next = appendEvent(next, "Marked interest in the club fair preview from the Union board.");
      notification = { app: "Buzz", body: "Club fair interest noted." };
      break;
    case "bulletin_job_lead":
      next = addTrait(changeStats(next, { grit: 1 }), "job-curious");
      next = appendEvent(next, "Copied a part-time desk shift lead from the Union board.");
      notification = { app: "Anthrop", body: "Part-time job lead copied." };
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
      next = addAcademicPrep(next, "soc101", { reviewChunks: 5, focus: 2 });
      next = appendEvent(next, "Reviewed class notes in the dorm room.");
      break;
    case "tidy_room":
      next = changeResources(changeStats(next, { grit: 1 }), { energy: -3 });
      next = appendEvent(next, "Put the dorm room in better order.");
      break;
    case "sit_window":
      next = changeResources(changeStats(next, { knowledge: 2 }), { energy: 2, money: -3 });
      next = addAcademicPrep(next, "soc101", { studyChunks: 3, focus: 1 });
      next = appendEvent(next, "Studied for a while in the coffee shop window booth.");
      break;
    case "chat_counter":
      next = changeStats(next, { charm: 2, sensitivity: 1 });
      next = updateRelationship(next, "studious", {
        scoreDelta: 1,
        status: "friendly",
        flags: { trust: Number(getRelationshipFlag(next, "studious", "trust")) + 1 },
        lastSeenDisposition: "Warmer at the counter, still keeping work boundaries clear.",
      });
      next = addSharedMoment(next, "studious", {
        label: "Counter chat",
        text: "You lingered at the counter and Mari let the conversation breathe for a minute.",
        tags: ["coffee_shop", "trust"],
      });
      next = appendEvent(next, "Chatted with Mari at the coffee shop counter.", ["studious"]);
      break;
    case "ask_mari_about_marcus":
      next = updateRelationship(next, "studious", {
        scoreDelta: 1,
        status: "friendly",
        flags: {
          trust: Number(getRelationshipFlag(next, "studious", "trust")) + 1,
          awkward: Number(getRelationshipFlag(next, "studious", "awkward")) + 1,
        },
        lastSeenDisposition: "Amused, cautious, and more aware of the triangle forming.",
      });
      next = addSharedMomentForMany(next, ["studious", "roommate"], {
        label: "Asked about Marcus",
        text: "You asked Mari how she knows Marcus; the answer was careful enough to matter.",
        tags: ["mari", "marcus", "chemistry"],
      });
      next = appendEvent(next, "Asked Mari how she knows Marcus.", ["studious"]);
      break;
    case "ask_marcus_about_mari":
      next = updateRelationship(next, "roommate", {
        scoreDelta: 1,
        status: "old friend",
        flags: {
          trust: Number(getRelationshipFlag(next, "roommate", "trust")) + 1,
          awkward: Number(getRelationshipFlag(next, "roommate", "awkward")) + 1,
        },
        lastSeenDisposition: "Trying to stay casual while checking what you noticed.",
      });
      next = addSharedMomentForMany(next, ["roommate", "studious"], {
        label: "Asked about Mari",
        text: "You asked Marcus about Mari and caught him choosing his words more carefully than usual.",
        tags: ["mari", "marcus", "chemistry"],
      });
      next = appendEvent(next, "Asked Marcus about Mari back at the dorm.", ["roommate"]);
      break;
    case "suggest_after_shift":
      next = updateRelationship(next, "studious", {
        scoreDelta: 2,
        status: "maybe plans",
        flags: {
          trust: Number(getRelationshipFlag(next, "studious", "trust")) + 1,
          date_planned: true,
        },
        lastSeenDisposition: "Interested, but still measuring whether you understand her boundaries.",
      });
      next = addSharedMoment(next, "studious", {
        label: "After-shift idea",
        text: "You suggested coffee after her shift; Mari did not say yes lightly, but she did not close the door.",
        tags: ["date_planned", "coffee_shop"],
      });
      next = appendEvent(next, "Suggested meeting Mari after her shift.", ["studious"]);
      notification = { app: "Roster", body: "Mari has a new relationship moment." };
      break;
    case "look_around_location":
      next = changeStats(next, { sensitivity: 1 });
      next = appendEvent(next, `Looked around ${currentLocationLabel(next)} and got a better read on the place.`);
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
  if (choice.id.startsWith("bulletin_event_")) return 1;
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
    ask_mari_about_marcus: 3,
    ask_marcus_about_mari: 4,
    suggest_after_shift: 2,
    bulletin_study_group: 1,
    bulletin_club_fair: 1,
    bulletin_job_lead: 1,
    look_around_location: 2,
    rest: 8,
    wait: 4,
    leave: 1,
  };
  return durations[choice.id] || DEFAULT_ACTION_CHUNKS;
}

export function navigateToLocation(state: GameState, locationKey: LocationId): GameUpdate {
  if (state.location === locationKey) return { state };

  const travelPlan = getTravelPlan(state, locationKey);
  if (!travelPlan.canAfford) {
    return {
      state,
      notification: { app: "Compass", body: travelPlan.blockedReason || "You cannot afford that trip right now." },
    };
  }

  const verb = travelPlan.mode === "Walk" ? "Walked" : travelPlan.mode === "Bike" ? "Biked" : "Rode";
  const traveled = appendEvent(state, `${verb} to ${travelPlan.toLabel} (${travelPlan.durationLabel}, ${travelPlan.costLabel})`);
  const next = changeResources(advanceTime(traveled, travelPlan.durationChunks), {
    energy: -travelPlan.energyCost,
    money: -travelPlan.moneyCost,
  });
  return withCalendarReminder(updateRoommateStudiousChemistry(
    visitLocation({ ...next, location: locationKey }, locationKey),
    { kind: "navigate", from: state.location, to: locationKey },
  ));
}

export function applyChoice(state: GameState, choice: Choice): GameUpdate {
  let next = advanceTime(appendEvent(state, `Chose: ${choice.label}`), getChoiceDurationChunks(choice));
  let notification: GameUpdate["notification"];

  if (choice.tag === "intro_complete") {
    next = learnLocation({ ...next, introSeen: true }, "coffee_shop", "Marcus's fridge note", "rumored");
  }

  if (choice.tag === "met_mari" || choice.tag === "met_mari_quiet") {
    next = appendEvent(next, "Met Mari at the coffee shop.", ["studious"]);
    next = {
      ...next,
      metMari: true,
      npcsKnown: next.npcsKnown.includes("studious") ? next.npcsKnown : [...next.npcsKnown, "studious"],
    };
    next = updateRelationship(next, "studious", {
      scoreDelta: 1,
      status: "met",
      flags: { trust: 1, awkward: 0, texting: false, date_planned: false },
      lastSeenDisposition: "Professionally warm and curious.",
    });
    next = addSharedMoment(next, "studious", {
      label: "First order",
      text: "You met Mari at the coffee shop counter and she clocked you as Marcus's new roommate.",
      tags: ["first_meeting", "coffee_shop"],
    });
    notification = { app: "Pulse", body: "Mari saved your number." };
  }

  if (choice.id === "go_coffee") next = visitLocation({ ...next, location: "coffee_shop" }, "coffee_shop");
  if (choice.id === "explore") next = visitLocation({ ...next, location: "quad" }, "quad");

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

  const chemistryUpdate = updateRoommateStudiousChemistry(next, { kind: "choice", choice });
  return withCalendarReminder({ state: chemistryUpdate.state, notification: chemistryUpdate.notification || notification });
}

export function sendPulseMessage(state: GameState, npcId: NpcId, templateId: PulseTemplateId): GameUpdate {
  const npc = state.npcDirectory?.[npcId] || STARTER_NPCS[npcId];
  const queued = queuePulseMessage(state, npcId, templateId);
  const text = outgoingPulseText(templateId);

  let next = appendEvent(
    {
      ...state,
      messages: [...state.messages, ...queued.messages],
    },
    `Texted ${npc?.name || npcId}: ${text}`,
    [npcId],
  );
  next = updateRelationship(next, npcId, {
    scoreDelta: templateId === "invite_coffee" ? 2 : 1,
    status: "texting",
    flags: {
      texting: true,
      trust: Number(getRelationshipFlag(next, npcId, "trust")) + 1,
      ...(templateId === "invite_coffee" ? { date_planned: true } : {}),
    },
    lastSeenDisposition: templateId === "invite_coffee" ? "Considering a plan outside the default routine." : "Responsive over text.",
  });
  next = addSharedMoment(next, npcId, {
    label: templateId === "invite_coffee" ? "Coffee invite" : "Text thread",
    text: templateId === "invite_coffee"
      ? `You asked ${npc?.name || npcId} about getting coffee sometime this week.`
      : `You kept the thread with ${npc?.name || npcId} alive without making it a performance.`,
    tags: ["texting", ...(templateId === "invite_coffee" ? ["date_planned"] : [])],
  });
  const chemistryUpdate = updateRoommateStudiousChemistry(next, { kind: "pulse", npcId, templateId });

  return {
    state: chemistryUpdate.state,
    notification: chemistryUpdate.notification || { app: "Pulse", body: `Sent. Reply expected from ${queued.replyAt}.` },
  };
}

export function addMarginNote(state: GameState, text: string, links?: GameNote["links"]): GameUpdate {
  const trimmed = text.trim();
  if (!trimmed) return { state };

  const note: GameNote = {
    id: `${state.day}-${state.timeSlot}-${Date.now()}`,
    day: state.day,
    slot: state.timeSlot,
    text: trimmed,
    links,
    source: links?.category || "manual",
  };

  return {
    state: {
      ...appendEvent(state, "Added a note in Margin."),
      notes: [...state.notes, note],
    },
  };
}
