import type { ChemistryObservation, ChemistryRecord, Choice, GameUpdate, GameState, NpcId } from "../types/game";
import { appendEvent } from "./state";

export const ROOMMATE_STUDIOUS_PAIR_ID = "roommate_studious";
export const PLAYER_STUDIOUS_PAIR_ID = "player_studious";
export const PLAYER_ROOMMATE_STUDIOUS_GROUP_ID = "player_roommate_studious";

type ChemistryTrigger =
  | { kind: "choice"; choice: Choice }
  | { kind: "navigate"; from: string; to: string }
  | { kind: "pulse"; npcId: NpcId; templateId: string };

interface ObservationDefinition {
  id: string;
  label: string;
  text: string;
  sensitivityGate: number;
  requiredFlags: string[];
}

const ROOMMATE_STUDIOUS_OBSERVATIONS: ObservationDefinition[] = [
  {
    id: "coffee_note_was_intentional",
    label: "Intentional Recommendation",
    sensitivityGate: 35,
    requiredFlags: ["marcus_recommended_shop", "first_mari_contact"],
    text: "Marcus did not send you to a random coffee shop. The recommendation had a person attached to it, even if he left that unsaid.",
  },
  {
    id: "mari_knows_the_routine",
    label: "Known Routine",
    sensitivityGate: 45,
    requiredFlags: ["mari_counter_rhythm"],
    text: "Mari seems to know Marcus as a routine, not a rumor. She gives the overlap room instead of making it a performance.",
  },
  {
    id: "marcus_checks_the_tone",
    label: "Careful Check-In",
    sensitivityGate: 55,
    requiredFlags: ["dorm_return_after_mari"],
    text: "Marcus asks about the coffee shop too casually. He is checking whether Mari was kind without admitting he is checking.",
  },
  {
    id: "triangle_has_edges",
    label: "Awkward Geometry",
    sensitivityGate: 65,
    requiredFlags: ["texting_mari_plan", "marcus_knows_mari_matters"],
    text: "The shape between Marcus and Mari is not rivalry. It is two people trying not to define their overlap through you.",
  },
];

const PLAYER_STUDIOUS_OBSERVATIONS: ObservationDefinition[] = [
  {
    id: "work_boundary_respected",
    label: "Work Boundary",
    sensitivityGate: 40,
    requiredFlags: ["first_mari_contact", "counter_comfort"],
    text: "Mari warms most when the conversation leaves her room to keep working. Respecting that boundary is part of the rapport.",
  },
  {
    id: "thread_outside_work",
    label: "Thread Outside Work",
    sensitivityGate: 45,
    requiredFlags: ["texting_thread"],
    text: "The thread changes the shape of things: Mari can answer when she chooses, instead of performing friendliness across the counter.",
  },
  {
    id: "plan_with_edges",
    label: "Plan With Edges",
    sensitivityGate: 55,
    requiredFlags: ["after_shift_plan"],
    text: "The after-shift idea interests Mari, but only because it sounds like an invitation she can decline without punishment.",
  },
];

const PLAYER_ROOMMATE_STUDIOUS_OBSERVATIONS: ObservationDefinition[] = [
  {
    id: "two_versions_of_the_same_overlap",
    label: "Two Versions",
    sensitivityGate: 45,
    requiredFlags: ["asked_mari_about_marcus", "asked_marcus_about_mari"],
    text: "Mari and Marcus describe each other from different angles, and both leave out the part that would make the story easy.",
  },
  {
    id: "plan_changes_room_tone",
    label: "Room Tone Shift",
    sensitivityGate: 60,
    requiredFlags: ["date_plan", "asked_marcus_about_mari"],
    text: "A plan with Mari changes the dorm room's air. Marcus is not jealous so much as suddenly aware the triangle has become real.",
  },
];

function pairRecord(state: GameState): ChemistryRecord {
  return state.chemistry?.[ROOMMATE_STUDIOUS_PAIR_ID] || {
    id: ROOMMATE_STUDIOUS_PAIR_ID,
    npcIds: ["roommate", "studious"],
    score: 0,
    hiddenFlags: {},
    revealedObservations: [],
  };
}

function chemistryRecord(state: GameState, id: string, npcIds: NpcId[]): ChemistryRecord {
  return state.chemistry?.[id] || {
    id,
    npcIds,
    score: 0,
    hiddenFlags: {},
    revealedObservations: [],
  };
}

function relationshipScore(state: GameState, npcId: NpcId) {
  const record = state.player.relationships?.[npcId];
  if (typeof record === "number") return record;
  if (typeof record === "string") return Number(record) || 0;
  if (record && typeof record === "object") return Number(record.score ?? record.value ?? record.affinity) || 0;
  return 0;
}

function relationshipFlag(state: GameState, npcId: NpcId, flag: string) {
  const record = state.player.relationships?.[npcId];
  if (record && typeof record === "object") return record.flags?.[flag];
  return undefined;
}

function hasFlag(record: ChemistryRecord, flag: string) {
  return Boolean(record.hiddenFlags[flag]);
}

function withHiddenFlag(record: ChemistryRecord, flag: string, value: unknown = true) {
  if (record.hiddenFlags[flag] === value) return { record, added: false };
  return {
    record: {
      ...record,
      hiddenFlags: {
        ...record.hiddenFlags,
        [flag]: value,
      },
    },
    added: !record.hiddenFlags[flag],
  };
}

function withIncrementedFlag(record: ChemistryRecord, flag: string) {
  const nextValue = (Number(record.hiddenFlags[flag]) || 0) + 1;
  return {
    ...record,
    hiddenFlags: {
      ...record.hiddenFlags,
      [flag]: nextValue,
    },
  };
}

function applyFlag(record: ChemistryRecord, flag: string, scoreDelta: number) {
  const result = withHiddenFlag(record, flag);
  return {
    record: result.added ? { ...result.record, score: result.record.score + scoreDelta } : result.record,
    added: result.added,
  };
}

function revealedIds(record: ChemistryRecord) {
  return new Set(record.revealedObservations.map(observation => observation.id));
}

function canReveal(state: GameState, record: ChemistryRecord, observation: ObservationDefinition) {
  if (state.player.stats.sensitivity < observation.sensitivityGate) return false;
  if (revealedIds(record).has(observation.id)) return false;
  return observation.requiredFlags.every(flag => hasFlag(record, flag));
}

function triggerLabel(trigger: ChemistryTrigger) {
  if (trigger.kind === "choice") return trigger.choice.id;
  if (trigger.kind === "navigate") return `arrive:${trigger.to}`;
  return `pulse:${trigger.npcId}:${trigger.templateId}`;
}

function revealUnlockedObservations(state: GameState, record: ChemistryRecord, trigger: ChemistryTrigger) {
  let nextState = state;
  let nextRecord = record;
  const revealed: ChemistryObservation[] = [];

  for (const definition of ROOMMATE_STUDIOUS_OBSERVATIONS) {
    if (!canReveal(nextState, nextRecord, definition)) continue;

    const observation: ChemistryObservation = {
      id: definition.id,
      pairId: ROOMMATE_STUDIOUS_PAIR_ID,
      day: nextState.day,
      slot: nextState.timeSlot,
      label: definition.label,
      text: definition.text,
      sensitivityGate: definition.sensitivityGate,
      trigger: triggerLabel(trigger),
    };

    nextRecord = {
      ...nextRecord,
      revealedObservations: [...nextRecord.revealedObservations, observation],
    };
    nextState = appendEvent(nextState, `Noticed between Marcus and Mari: ${definition.text}`);
    revealed.push(observation);
  }

  return { state: nextState, record: nextRecord, revealed };
}

function revealUnlockedGenericObservations(
  state: GameState,
  record: ChemistryRecord,
  definitions: ObservationDefinition[],
  trigger: ChemistryTrigger,
) {
  let nextState = state;
  let nextRecord = record;
  const revealed: ChemistryObservation[] = [];

  for (const definition of definitions) {
    if (!canReveal(nextState, nextRecord, definition)) continue;

    const observation: ChemistryObservation = {
      id: definition.id,
      pairId: nextRecord.id,
      day: nextState.day,
      slot: nextState.timeSlot,
      label: definition.label,
      text: definition.text,
      sensitivityGate: definition.sensitivityGate,
      trigger: triggerLabel(trigger),
    };

    nextRecord = {
      ...nextRecord,
      revealedObservations: [...nextRecord.revealedObservations, observation],
    };
    nextState = appendEvent(nextState, `Noticed a social pattern: ${definition.text}`);
    revealed.push(observation);
  }

  return { state: nextState, record: nextRecord, revealed };
}

function setPairRecord(state: GameState, record: ChemistryRecord): GameState {
  return {
    ...state,
    chemistry: {
      ...(state.chemistry || {}),
      [ROOMMATE_STUDIOUS_PAIR_ID]: {
        ...record,
        lastUpdatedDay: state.day,
        lastUpdatedSlot: state.timeSlot,
      },
    },
  };
}

function setChemistryRecord(state: GameState, record: ChemistryRecord): GameState {
  return {
    ...state,
    chemistry: {
      ...(state.chemistry || {}),
      [record.id]: {
        ...record,
        lastUpdatedDay: state.day,
        lastUpdatedSlot: state.timeSlot,
      },
    },
  };
}

function updateRoommateStudiousFlags(state: GameState, trigger: ChemistryTrigger) {
  let record = pairRecord(state);
  let changed = false;
  const mariScore = relationshipScore(state, "studious");

  if (state.metMari) {
    const recommended = applyFlag(record, "marcus_recommended_shop", 1);
    record = recommended.record;
    changed ||= recommended.added;

    const met = applyFlag(record, "first_mari_contact", 1);
    record = met.record;
    changed ||= met.added;
  }

  if (mariScore >= 3) {
    const rhythm = applyFlag(record, "mari_counter_rhythm", 1);
    record = rhythm.record;
    changed ||= rhythm.added;
  }

  if (state.metMari && state.location === "dorm_room") {
    const dormReturn = applyFlag(record, "dorm_return_after_mari", 1);
    record = dormReturn.record;
    changed ||= dormReturn.added;
  }

  if (trigger.kind === "choice") {
    const { choice } = trigger;

    if (choice.id === "go_coffee") {
      const result = applyFlag(record, "marcus_recommended_shop", 1);
      record = result.record;
      changed ||= result.added;
    }

    if (choice.tag === "met_mari" || choice.tag === "met_mari_quiet") {
      const result = applyFlag(record, "first_mari_contact", 1);
      record = result.record;
      changed ||= result.added;
    }

    if (choice.id === "chat_counter") {
      record = withIncrementedFlag(record, "mari_counter_chat_count");
      changed = true;
      if ((Number(record.hiddenFlags.mari_counter_chat_count) || 0) >= 2) {
        const result = applyFlag(record, "mari_counter_rhythm", 1);
        record = result.record;
        changed ||= result.added;
      }
    }

    if ((choice.id === "review_notes" || choice.id === "tidy_room" || choice.id === "rest") && state.metMari) {
      const result = applyFlag(record, "marcus_knows_mari_matters", 1);
      record = result.record;
      changed ||= result.added;
    }
  }

  if (trigger.kind === "navigate") {
    if (trigger.to === "dorm_room" && state.metMari) {
      const result = applyFlag(record, "dorm_return_after_mari", 1);
      record = result.record;
      changed ||= result.added;
    }

    if (trigger.to === "coffee_shop" && state.introSeen) {
      const result = applyFlag(record, "coffee_shop_loop", 1);
      record = result.record;
      changed ||= result.added;
    }
  }

  if (trigger.kind === "pulse" && trigger.npcId === "studious") {
    if (trigger.templateId === "invite_coffee") {
      const result = applyFlag(record, "texting_mari_plan", 2);
      record = result.record;
      changed ||= result.added;
    } else {
      record = withIncrementedFlag(record, "mari_text_count");
      changed = true;
    }
  }

  if (mariScore >= 3) {
    const result = applyFlag(record, "mari_warming_to_player", 1);
    record = result.record;
    changed ||= result.added;
  }

  return { record, changed };
}

function updatePlayerStudiousFlags(state: GameState, trigger: ChemistryTrigger) {
  let record = chemistryRecord(state, PLAYER_STUDIOUS_PAIR_ID, ["player", "studious"]);
  let changed = false;

  if (state.metMari) {
    const result = applyFlag(record, "first_mari_contact", 1);
    record = result.record;
    changed ||= result.added;
  }

  if (relationshipFlag(state, "studious", "texting")) {
    const result = applyFlag(record, "texting_thread", 1);
    record = result.record;
    changed ||= result.added;
  }

  if (relationshipFlag(state, "studious", "date_planned")) {
    const result = applyFlag(record, "after_shift_plan", 2);
    record = result.record;
    changed ||= result.added;
  }

  if (trigger.kind === "choice") {
    if (trigger.choice.id === "chat_counter") {
      const result = applyFlag(record, "counter_comfort", 1);
      record = result.record;
      changed ||= result.added;
    }

    if (trigger.choice.id === "suggest_after_shift") {
      const result = applyFlag(record, "after_shift_plan", 2);
      record = result.record;
      changed ||= result.added;
    }
  }

  if (trigger.kind === "pulse" && trigger.npcId === "studious") {
    const result = applyFlag(record, "texting_thread", 1);
    record = result.record;
    changed ||= result.added;
  }

  return { record, changed };
}

function updatePlayerRoommateStudiousFlags(state: GameState, trigger: ChemistryTrigger) {
  let record = chemistryRecord(state, PLAYER_ROOMMATE_STUDIOUS_GROUP_ID, ["player", "roommate", "studious"]);
  let changed = false;

  if (relationshipFlag(state, "studious", "date_planned")) {
    const result = applyFlag(record, "date_plan", 1);
    record = result.record;
    changed ||= result.added;
  }

  if (trigger.kind === "choice") {
    if (trigger.choice.id === "ask_mari_about_marcus") {
      const result = applyFlag(record, "asked_mari_about_marcus", 1);
      record = result.record;
      changed ||= result.added;
    }

    if (trigger.choice.id === "ask_marcus_about_mari") {
      const result = applyFlag(record, "asked_marcus_about_mari", 1);
      record = result.record;
      changed ||= result.added;
    }

    if (trigger.choice.id === "suggest_after_shift") {
      const result = applyFlag(record, "date_plan", 1);
      record = result.record;
      changed ||= result.added;
    }
  }

  if (trigger.kind === "pulse" && trigger.npcId === "studious" && trigger.templateId === "invite_coffee") {
    const result = applyFlag(record, "date_plan", 1);
    record = result.record;
    changed ||= result.added;
  }

  return { record, changed };
}

function updateExpandedChemistry(state: GameState, trigger: ChemistryTrigger): GameUpdate {
  let nextState = state;
  let latestObservation: ChemistryObservation | undefined;

  const playerStudious = updatePlayerStudiousFlags(nextState, trigger);
  if (playerStudious.changed) {
    const revealed = revealUnlockedGenericObservations(nextState, playerStudious.record, PLAYER_STUDIOUS_OBSERVATIONS, trigger);
    nextState = setChemistryRecord(revealed.state, revealed.record);
    latestObservation = revealed.revealed[revealed.revealed.length - 1] || latestObservation;
  }

  const group = updatePlayerRoommateStudiousFlags(nextState, trigger);
  if (group.changed) {
    const revealed = revealUnlockedGenericObservations(nextState, group.record, PLAYER_ROOMMATE_STUDIOUS_OBSERVATIONS, trigger);
    nextState = setChemistryRecord(revealed.state, revealed.record);
    latestObservation = revealed.revealed[revealed.revealed.length - 1] || latestObservation;
  }

  return {
    state: nextState,
    notification: latestObservation
      ? { app: "Roster", body: `New observation: ${latestObservation.label}.` }
      : undefined,
  };
}

export function updateRoommateStudiousChemistry(state: GameState, trigger: ChemistryTrigger): GameUpdate {
  const { record, changed } = updateRoommateStudiousFlags(state, trigger);
  let nextState = state;
  let latestObservation: ChemistryObservation | undefined;

  if (changed) {
    const revealResult = revealUnlockedObservations(state, record, trigger);
    nextState = setPairRecord(revealResult.state, revealResult.record);
    latestObservation = revealResult.revealed[revealResult.revealed.length - 1];
  }

  const expanded = updateExpandedChemistry(nextState, trigger);

  return {
    state: expanded.state,
    notification: expanded.notification || (latestObservation
      ? { app: "Roster", body: `New observation: ${latestObservation.label}.` }
      : undefined),
  };
}

export function getChemistryObservationsForNpc(state: GameState, npcId: NpcId): ChemistryObservation[] {
  return Object.values(state.chemistry || {})
    .filter(record => record.npcIds.includes(npcId))
    .flatMap(record => record.revealedObservations)
    .sort((a, b) => (b.day - a.day) || (b.slot - a.slot));
}
