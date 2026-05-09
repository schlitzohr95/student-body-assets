export type StatKey = "charm" | "sensitivity" | "knowledge" | "athletics" | "grit";
export type TimeSlotIndex = number;
export type LocationCategory = "campus" | "town" | "outdoor";

export type LocationId = string;
export type NpcId = string;

export interface PlayerStats extends Record<StatKey, number> {}

export interface PlayerResources {
  energy: number;
  money: number;
}

export interface RelationshipRecord {
  score: number | string;
  status?: string;
  traits?: string[];
  lastSeenDisposition?: string;
  disposition?: string;
  summary?: string;
  label?: string;
  value?: number | string;
  affinity?: number | string;
}

export interface PlayerState {
  name: string;
  stats: PlayerStats;
  resources: PlayerResources;
  traits?: string[];
  relationships?: Record<NpcId, RelationshipRecord | number | string>;
}

export interface GameEvent {
  day?: number;
  week?: number;
  slot?: number | string;
  timeSlot?: number | string;
  semesterDay?: number;
  dayNumber?: number;
  dayName?: string;
  kind?: string;
  text?: string;
  summary?: string;
  event_summary?: string;
  label?: string;
  witnesses?: Array<string | { id?: string; key?: string; name?: string }>;
  witnessedBy?: Array<string | { id?: string; key?: string; name?: string }>;
  witnessIds?: Array<string | { id?: string; key?: string; name?: string }>;
  witness_ids?: Array<string | { id?: string; key?: string; name?: string }>;
  npcWitnesses?: Array<string | { id?: string; key?: string; name?: string }>;
}

export interface GameMessage {
  id: string;
  day: number;
  slot: number;
  npcId: NpcId;
  direction: "outgoing" | "incoming";
  text: string;
  read: boolean;
}

export interface GameNote {
  id: string;
  day: number;
  slot: number;
  text: string;
}

export interface NpcSchema {
  ageBand?: string;
  publicFace?: string;
  voice?: string;
  wants?: string[];
  whatLands?: string[];
  whatFallsFlat?: string[];
  boundaries?: string[];
  [key: string]: unknown;
}

export interface Npc {
  id: NpcId;
  name: string;
  portraitKey?: string;
  archetype?: string;
  role?: string;
  defaultLocation?: LocationId;
  currentLocation?: LocationId;
  location?: LocationId;
  schema?: NpcSchema;
  currentMood?: string;
  mood?: string;
  lastSeenDisposition?: string;
  [key: string]: unknown;
}

export interface LocationDefinition {
  id: LocationId;
  label: string;
  cat: LocationCategory;
  description: string;
}

export interface Choice {
  id: string;
  label: string;
  tag?: string;
}

export interface Scene {
  narration: string;
  choices: Choice[];
}

export interface GameState {
  version: number;
  timeScale?: "quarter-hour";
  day: number;
  timeSlot: TimeSlotIndex;
  location: LocationId;
  introSeen: boolean;
  metMari: boolean;
  player: PlayerState;
  npcsKnown: string[];
  eventLog: GameEvent[];
  messages: GameMessage[];
  notes: GameNote[];
  npcDirectory?: Record<NpcId, Npc>;
  npcMoods?: Record<NpcId, string>;
  presentNpcIds?: NpcId[];
  presentNpcs?: Array<NpcId | Npc>;
  scene?: {
    presentNpcIds?: NpcId[];
    npcsPresent?: Array<NpcId | Npc>;
  };
  currentScene?: {
    presentNpcIds?: NpcId[];
    npcsPresent?: Array<NpcId | Npc>;
  };
  world?: {
    npcs?: Npc[] | Record<NpcId, Npc>;
    characters?: Npc[] | Record<NpcId, Npc>;
  };
  flags?: Record<string, unknown>;
}

export interface PhoneAppDefinition {
  id: string;
  label: string;
  role: string;
  layout: "portrait" | "landscape";
  implemented: boolean;
}

export interface GameUpdate {
  state: GameState;
  notification?: {
    app: string;
    body: string;
  };
}

export interface NarratorParsedResponse {
  narration: string;
  choices: Choice[];
  open: boolean;
  statePatch: Record<string, unknown> | null;
  stateParseError: unknown | null;
}
