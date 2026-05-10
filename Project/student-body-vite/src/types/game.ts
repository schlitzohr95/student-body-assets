export type StatKey = "charm" | "sensitivity" | "knowledge" | "athletics" | "grit";
export type TimeSlotIndex = number;
export type LocationCategory = "campus" | "town" | "outdoor";

export type LocationId = string;
export type NpcId = string;
export type NarratorSceneMode = "scripted" | "generated" | "generated_fallback";
export type CalendarEventKind = "class" | "test" | "deadline" | "social" | "work" | "reminder";

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

export interface ChemistryObservation {
  id: string;
  pairId: string;
  day: number;
  slot: number;
  label: string;
  text: string;
  sensitivityGate: number;
  trigger?: string;
}

export interface ChemistryRecord {
  id: string;
  npcIds: NpcId[];
  score: number;
  hiddenFlags: Record<string, unknown>;
  revealedObservations: ChemistryObservation[];
  lastUpdatedDay?: number;
  lastUpdatedSlot?: number;
}

export type AcademicQuestionType = "multiple_choice" | "multi_select" | "order" | "short_text";
export type AcademicAnswerValue = string | string[];

export interface AcademicAnswerOption {
  id: string;
  label: string;
  correct?: boolean;
}

export interface AcademicQuestion {
  id: string;
  type?: AcademicQuestionType;
  prompt: string;
  options?: AcademicAnswerOption[];
  correctAnswers?: string[];
  explanation: string;
  hint?: string;
  skill?: StatKey;
}

export interface AcademicCourseDefinition {
  id: string;
  code: string;
  title: string;
  instructor: string;
  location: LocationId;
  meetingDays: number[];
  summary: string;
  stakes: string;
}

export interface AcademicTestDefinition {
  id: string;
  courseId: string;
  courseTitle: string;
  label: string;
  day: number;
  startSlot?: TimeSlotIndex;
  endSlot?: TimeSlotIndex;
  location: LocationId;
  baseDifficulty: number;
  minQuestions?: number;
  questions: AcademicQuestion[];
}

export interface AcademicStudyEntry {
  day: number;
  slot: TimeSlotIndex;
  studyChunks: number;
  reviewChunks: number;
  focus: number;
}

export interface AcademicPrepRecord {
  studyChunks: number;
  reviewChunks: number;
  focus: number;
  history?: AcademicStudyEntry[];
  lastStudiedDay?: number;
  lastStudiedSlot?: number;
}

export interface AcademicTestAnswer {
  questionId: string;
  answerId?: string;
  answerIds?: string[];
  value?: AcademicAnswerValue;
  correct: boolean;
}

export type AcademicTestOutcome = "failed" | "partial" | "passed" | "high";

export interface AcademicTestResult {
  testId: string;
  courseId: string;
  day: number;
  slot: number;
  correct: number;
  total: number;
  threshold: number;
  passed: boolean;
  grade: string;
  outcome: AcademicTestOutcome;
  percentage: number;
  prepScore: number;
  difficulty: number;
  curveBonus: number;
  courseStanding: number;
  consequences: string[];
  answers: AcademicTestAnswer[];
}

export interface AcademicCourseRecord {
  courseId: string;
  standing: number;
  highScores: number;
  passes: number;
  partials: number;
  failures: number;
  lastGrade?: string;
  flags?: string[];
}

export interface AcademicsState {
  prep: Record<string, AcademicPrepRecord>;
  completedTests: Record<string, AcademicTestResult>;
  courses?: Record<string, AcademicCourseRecord>;
}

export interface CalendarEvent {
  id: string;
  title: string;
  kind: CalendarEventKind;
  day: number;
  startSlot: number;
  endSlot?: number;
  location?: LocationId;
  description?: string;
  courseId?: string;
  testId?: string;
  npcIds?: NpcId[];
  source?: string;
}

export interface CalendarState {
  seenReminderIds: string[];
}

export interface NpcScheduleBlock {
  start: string | number;
  end?: string | number;
  location: LocationId;
  mood?: string;
  label?: string;
  days?: Array<string | number>;
  source?: string;
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
  hours?: string;
  initiallyKnown?: boolean;
  hiddenUntilDiscovered?: boolean;
}

export type LocationDiscoveryState = "unknown" | "rumored" | "known" | "visited";

export interface LocationKnowledgeRecord {
  state: LocationDiscoveryState;
  discoveredDay?: number;
  discoveredSlot?: TimeSlotIndex;
  source?: string;
  isNew?: boolean;
  hoursKnown?: boolean;
}

export interface WorldPackMeta {
  id?: string;
  name?: string;
  version?: string;
  author?: string;
  description?: string;
  importedAt?: string;
  sourceFileName?: string;
  [key: string]: unknown;
}

export interface WorldPack {
  id?: string;
  name?: string;
  version?: string;
  author?: string;
  description?: string;
  npcs?: Npc[] | Record<NpcId, Npc>;
  characters?: Npc[] | Record<NpcId, Npc>;
  cast?: Npc[] | Record<NpcId, Npc>;
  locations?: LocationDefinition[] | Record<LocationId, LocationDefinition>;
  places?: LocationDefinition[] | Record<LocationId, LocationDefinition>;
  schedules?: Record<string, unknown>;
  npcSchedules?: Record<NpcId, unknown>;
  calendarEvents?: CalendarEvent[];
  calendar?: CalendarEvent[] | { events?: CalendarEvent[] };
  events?: CalendarEvent[];
  deadlines?: CalendarEvent[];
  arcs?: unknown;
  storyArcs?: unknown;
  knownNpcIds?: NpcId[];
  flags?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GameWorldState {
  npcs?: Npc[] | Record<NpcId, Npc>;
  characters?: Npc[] | Record<NpcId, Npc>;
  locations?: LocationDefinition[] | Record<LocationId, LocationDefinition>;
  schedules?: Record<string, unknown>;
  npcSchedules?: Record<NpcId, unknown>;
  calendarEvents?: CalendarEvent[];
  arcs?: unknown;
  storyArcs?: unknown;
  packMeta?: WorldPackMeta[];
  [key: string]: unknown;
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

export interface NarratorSettings {
  mode: NarratorSceneMode;
  providerType: "mock" | "window" | "http";
  endpoint?: string;
  model?: string;
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
  locationKnowledge?: Record<LocationId, LocationKnowledgeRecord>;
  eventLog: GameEvent[];
  messages: GameMessage[];
  notes: GameNote[];
  chemistry?: Record<string, ChemistryRecord>;
  academics?: AcademicsState;
  calendar?: CalendarState;
  narrator?: NarratorSettings;
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
  world?: GameWorldState;
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
