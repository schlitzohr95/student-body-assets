import type { GameState, Scene } from "../types/game";
import { getDaypartLabel } from "../data/locations";
import { getLocationDirectory, getNpcsAtLocation } from "./calendar";

export function getScriptedScene(state: GameState): Scene {
  const { location, day, timeSlot, metMari, introSeen } = state;

  if (location === "dorm_room" && !introSeen) {
    return {
      narration:
        "First morning. The boxes you didn't unpack last night are still where you left them. Your roommate Marcus is gone. There's a note on the fridge in handwriting that's somehow already familiar: \"coffee shop down the street is good. back by noon.\" Under it, Marcus has drawn a tiny map, and Compass has a new town pin waiting. The room is too quiet.",
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
        { id: "sit_window", label: "Take the window booth and study" },
        { id: "chat_counter", label: "Lean on the counter and chat" },
        { id: "leave", label: "Just grab something to go" },
      ],
    };
  }

  if (location === "library_main" || location === "library_stacks") {
    return {
      narration:
        "The library lowers its voice around you. Laptops glow between stacks of books, and every table has the same quiet bargain with time.",
      choices: [
        { id: "study_deep", label: "Settle in for focused study" },
        { id: "browse_stacks", label: "Wander the stacks" },
        { id: "leave", label: "Pack up and move on" },
      ],
    };
  }

  if (location === "gym") {
    return {
      narration:
        "The gym is all rubber floor, metal rhythm, and people pretending not to check whether anyone is watching their form.",
      choices: [
        { id: "workout_weights", label: "Lift for a while" },
        { id: "workout_cardio", label: "Use the cardio machines" },
        { id: "leave", label: "Head back out" },
      ],
    };
  }

  if (location === "running_trail") {
    return {
      narration:
        "The trail follows the creek through a strip of green that makes campus feel farther away than it is.",
      choices: [
        { id: "trail_run", label: "Go for a run" },
        { id: "trail_walk", label: "Take a thinking walk" },
        { id: "leave", label: "Turn back toward campus" },
      ],
    };
  }

  if (location === "student_union") {
    return {
      narration:
        "The student union is busy in layers: club tables near the doors, people waiting for food, someone laughing too loudly by the bulletin board.",
      choices: [
        { id: "browse_flyers", label: "Check the bulletin board" },
        { id: "people_watch", label: "People-watch from a couch" },
        { id: "leave", label: "Cut through and leave" },
      ],
    };
  }

  if (location === "dining_hall") {
    return {
      narration:
        "The dining hall hums with trays, half-finished conversations, and the practical relief of food you do not have to cook.",
      choices: [
        { id: "eat_meal", label: "Eat a real meal" },
        { id: "sit_with_strangers", label: "Sit near a busy table" },
        { id: "leave", label: "Take something to go" },
      ],
    };
  }

  if (location === "bookstore") {
    return {
      narration:
        "The bookstore smells like paper, dust, and branded sweatshirts. The course texts are up front, but the better shelves wait in back.",
      choices: [
        { id: "browse_books", label: "Browse the back shelves" },
        { id: "buy_supplies", label: "Buy basic supplies" },
        { id: "leave", label: "Head back outside" },
      ],
    };
  }

  if (location === "dorm_room" && introSeen) {
    return {
      narration:
        "Your room is starting to look less like a storage unit and more like a place you might actually sleep. The quiet is useful, if you can keep from wasting it.",
      choices: [
        { id: "review_notes", label: "Review class notes" },
        { id: "rest", label: "Rest for a while" },
        { id: "tidy_room", label: "Put the room in order" },
      ],
    };
  }

  const loc = getLocationDirectory(state)[location];
  const partOfDay = getDaypartLabel(timeSlot).toLowerCase();
  const present = getNpcsAtLocation(state, location).slice(0, 3).map(npc => npc.name || npc.id);
  const presentText = present.length ? ` ${present.join(", ")} ${present.length === 1 ? "is" : "are"} around.` : "";
  return {
    narration: loc
      ? `${loc.label}. ${loc.description}${presentText} It is ${partOfDay}, day ${day}, and the semester keeps moving around you.`
      : `Here. ${partOfDay}, day ${day}. The semester keeps moving around you.`,
    choices: [
      { id: "look_around_location", label: "Look around" },
      { id: "wait", label: "Spend some time here" },
      { id: "leave", label: "Move on" },
    ],
  };
}
