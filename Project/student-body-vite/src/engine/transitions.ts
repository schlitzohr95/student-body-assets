import type { Choice, GameState, GameUpdate, LocationId } from "../types/game";
import { LOCATIONS } from "../data/locations";
import { advanceTime, appendEvent } from "./state";

export function navigateToLocation(state: GameState, locationKey: LocationId): GameUpdate {
  if (state.location === locationKey) return { state };

  const destination = LOCATIONS[locationKey]?.label || locationKey;
  const next = advanceTime(appendEvent(state, `Walked to ${destination}`), 1);
  return { state: { ...next, location: locationKey } };
}

export function applyChoice(state: GameState, choice: Choice): GameUpdate {
  let next = advanceTime(appendEvent(state, `Chose: ${choice.label}`), 1);
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

  return { state: next, notification };
}
