import type { Npc, NpcId } from "../types/game";

export const STARTER_NPCS: Record<NpcId, Npc> = {
  studious: {
    id: "studious",
    name: "Mari",
    portraitKey: "studious",
    archetype: "Studious",
    role: "Coffee shop barista and campus-adjacent regular",
    defaultLocation: "coffee_shop",
    schema: {
      ageBand: "adult peer",
      publicFace: "Capable, dryly warm, observant from behind the counter.",
      voice: "Quick, understated, lightly teasing when comfortable; concise when busy.",
      wants: ["To be treated like a person, not a campus landmark", "To keep her work life from swallowing her private life"],
      whatLands: ["Specific curiosity", "Patience", "Remembering small details without making a show of it"],
      whatFallsFlat: ["Performative charm", "Assuming access because she is friendly at work", "Pushing when she is busy"],
      boundaries: ["Work is still work", "Private disclosures must be earned slowly"],
    },
    currentMood: "Focused on the counter rhythm; professionally warm, curious around new faces.",
    lastSeenDisposition: "Not yet met.",
  },
  roommate: {
    id: "roommate",
    name: "Marcus",
    portraitKey: "roommate",
    archetype: "Roommate",
    role: "Player's roommate and old high-school friend",
    defaultLocation: "dorm_room",
    schema: {
      ageBand: "adult peer",
      publicFace: "Easygoing, socially fluent, usually more prepared than he admits.",
      voice: "Casual and direct; jokes when things get tense, but notices more than he says.",
      wants: ["A good first semester", "To keep the room feeling livable", "To help without turning into a parent"],
      whatLands: ["Honesty", "Shared history", "Being included instead of managed"],
      whatFallsFlat: ["Needless secrecy", "Taking his steadiness for granted", "Making him clean up social fallout"],
      boundaries: ["He has his own campus life", "Friendship does not mean unlimited emotional labor"],
    },
    currentMood: "Loose, friendly, slightly ahead of the player on settling in.",
    lastSeenDisposition: "Familiar and friendly.",
  },
};
