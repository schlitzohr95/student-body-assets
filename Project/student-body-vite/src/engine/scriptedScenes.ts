import type { GameState, Scene } from "../types/game";
import { LOCATIONS, TIME_LABELS } from "../data/locations";

export function getScriptedScene(state: GameState): Scene {
  const { location, day, timeSlot, metMari, introSeen } = state;

  if (location === "dorm_room" && !introSeen) {
    return {
      narration:
        "First morning. The boxes you didn't unpack last night are still where you left them. Your roommate Marcus is gone. There's a note on the fridge in handwriting that's somehow already familiar: \"coffee shop down the street is good. back by noon.\" The room is too quiet.",
      choices: [
        { id: "go_coffee", label: "Head to the coffee shop", tag: "intro_complete" },
        { id: "unpack", label: "Stay in and unpack", tag: "intro_complete" },
        { id: "explore", label: "Walk the campus a bit", tag: "intro_complete" },
      ],
    };
  }

  if (location === "coffee_shop" && !metMari) {
    return {
      narration:
        "The bell above the door chimes. The shop smells like good coffee and old wood. Behind the counter, a barista with copper hair glances up, registers new face, and gives you a half-smile that's mostly professional with a little curiosity underneath. \"What can I get you?\"",
      choices: [
        { id: "order_drip", label: "\"Just a drip coffee, please.\"", tag: "met_mari" },
        { id: "order_fancy", label: "\"What do you recommend?\"", tag: "met_mari" },
        { id: "look_around", label: "Stall and read the menu", tag: "met_mari_quiet" },
      ],
    };
  }

  if (location === "coffee_shop" && metMari) {
    return {
      narration:
        "The shop is quieter this time. Mari spots you and gives a small nod from behind the espresso machine. The same booth by the window is open.",
      choices: [
        { id: "sit_window", label: "Take the window booth" },
        { id: "chat_counter", label: "Lean on the counter and chat" },
        { id: "leave", label: "Just grab something to go" },
      ],
    };
  }

  const loc = LOCATIONS[location];
  const partOfDay = TIME_LABELS[timeSlot].toLowerCase();
  return {
    narration: `${loc?.label || "Here"}. ${partOfDay}, day ${day}. The semester keeps moving around you.`,
    choices: [
      { id: "wait", label: "Spend some time here" },
      { id: "leave", label: "Move on" },
    ],
  };
}
