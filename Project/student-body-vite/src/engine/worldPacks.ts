import { LOCATIONS } from "../data/locations";
import { STARTER_NPCS } from "../data/npcs";
import type {
  AcademicCourseDefinition,
  AcademicQuestion,
  AcademicTestDefinition,
  BulletinPostDefinition,
  CalendarEvent,
  GameState,
  LocationCategory,
  LocationDefinition,
  LocationDiscoveryState,
  LocationId,
  LocationKnowledgeRecord,
  Npc,
  NpcId,
  RelationshipRecord,
  WorldPack,
  WorldPackMeta,
} from "../types/game";
import { normalizeRelationshipRecord } from "./relationships";
import { appendEvent } from "./state";

const LOCATION_CATEGORIES = new Set<LocationCategory>(["campus", "town", "outdoor"]);
const DISCOVERY_RANK: Record<LocationDiscoveryState, number> = {
  unknown: 0,
  rumored: 1,
  known: 2,
  visited: 3,
};

export type WorldPackValidationSeverity = "warning" | "error";

export interface WorldPackValidationIssue {
  severity: WorldPackValidationSeverity;
  path: string;
  message: string;
}

export interface WorldPackImportSummary {
  name: string;
  npcCount: number;
  locationCount: number;
  scheduleCount: number;
  arcCount: number;
  eventCount: number;
  courseCount: number;
  testCount: number;
  bulletinCount: number;
  relationshipCount: number;
  knownLocationCount: number;
  rumoredLocationCount: number;
  warningCount: number;
  errorCount: number;
  issues: WorldPackValidationIssue[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeLocationCategory(value: unknown): LocationCategory {
  const raw = stringValue(value).toLowerCase();
  return LOCATION_CATEGORIES.has(raw as LocationCategory) ? raw as LocationCategory : "campus";
}

function normalizeIdList(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter(item => typeof item === "string" && item.trim()).map(item => item.trim()))] : [];
}

export function normalizeNpcMap(source: unknown): Record<NpcId, Npc> {
  const next: Record<NpcId, Npc> = {};

  if (Array.isArray(source)) {
    for (const item of source) {
      if (!isRecord(item)) continue;
      const id = stringValue(item.id, stringValue(item.key, stringValue(item.name)));
      if (!id) continue;
      next[id] = { id, name: stringValue(item.name, id), ...item } as Npc;
    }
    return next;
  }

  if (isRecord(source)) {
    for (const [key, value] of Object.entries(source)) {
      if (!isRecord(value)) continue;
      const id = stringValue(value.id, key);
      next[id] = { id, name: stringValue(value.name, id), ...value } as Npc;
    }
  }

  return next;
}

export function normalizeLocationMap(source: unknown): Record<LocationId, LocationDefinition> {
  const next: Record<LocationId, LocationDefinition> = {};

  const addLocation = (key: string, value: unknown) => {
    if (!isRecord(value)) return;
    const id = stringValue(value.id, key);
    if (!id) return;
    const hours = stringValue(value.hours);
    const initiallyKnown = typeof value.initiallyKnown === "boolean" ? value.initiallyKnown : undefined;
    const hiddenUntilDiscovered = typeof value.hiddenUntilDiscovered === "boolean" ? value.hiddenUntilDiscovered : undefined;
    next[id] = {
      id,
      label: stringValue(value.label, stringValue(value.name, id)),
      cat: normalizeLocationCategory(value.cat || value.category),
      description: stringValue(value.description, stringValue(value.brief, stringValue(value.summary, "No authored description recorded yet."))),
      ...(hours ? { hours } : {}),
      ...(typeof initiallyKnown === "boolean" ? { initiallyKnown } : {}),
      ...(typeof hiddenUntilDiscovered === "boolean" ? { hiddenUntilDiscovered } : {}),
    };
  };

  if (Array.isArray(source)) {
    source.forEach((item, index) => addLocation(isRecord(item) ? stringValue(item.id, `location_${index + 1}`) : `location_${index + 1}`, item));
    return next;
  }

  if (isRecord(source)) {
    Object.entries(source).forEach(([key, value]) => addLocation(key, value));
  }

  return next;
}

export function normalizeAcademicCourseMap(source: unknown): Record<string, AcademicCourseDefinition> {
  const next: Record<string, AcademicCourseDefinition> = {};

  const addCourse = (key: string, value: unknown) => {
    if (!isRecord(value)) return;
    const id = stringValue(value.id, key);
    if (!id) return;
    const meetingDays = Array.isArray(value.meetingDays)
      ? value.meetingDays.map(Number).filter(Number.isFinite)
      : [];
    next[id] = {
      id,
      code: stringValue(value.code, id.toUpperCase()),
      title: stringValue(value.title, stringValue(value.name, id)),
      instructor: stringValue(value.instructor, "TBA"),
      location: stringValue(value.location, "lecture_hall"),
      meetingDays,
      summary: stringValue(value.summary, "No course summary authored yet."),
      stakes: stringValue(value.stakes, "No stakes authored yet."),
    };
  };

  if (Array.isArray(source)) {
    source.forEach((item, index) => addCourse(isRecord(item) ? stringValue(item.id, `course_${index + 1}`) : `course_${index + 1}`, item));
    return next;
  }

  if (isRecord(source)) {
    Object.entries(source).forEach(([key, value]) => addCourse(key, value));
  }

  return next;
}

function normalizeQuestion(source: unknown, fallbackId: string): AcademicQuestion | null {
  if (!isRecord(source)) return null;
  const id = stringValue(source.id, fallbackId);
  const prompt = stringValue(source.prompt);
  const explanation = stringValue(source.explanation, "No explanation authored yet.");
  if (!id || !prompt) return null;
  return {
    id,
    type: source.type as AcademicQuestion["type"],
    prompt,
    options: Array.isArray(source.options) ? source.options as AcademicQuestion["options"] : undefined,
    correctAnswers: Array.isArray(source.correctAnswers) ? source.correctAnswers.filter((item): item is string => typeof item === "string") : undefined,
    explanation,
    hint: stringValue(source.hint) || undefined,
    skill: source.skill as AcademicQuestion["skill"],
  };
}

export function normalizeAcademicTestMap(source: unknown): Record<string, AcademicTestDefinition> {
  const next: Record<string, AcademicTestDefinition> = {};

  const addTest = (key: string, value: unknown) => {
    if (!isRecord(value)) return;
    const id = stringValue(value.id, key);
    const questions = Array.isArray(value.questions)
      ? value.questions.map((question, index) => normalizeQuestion(question, `${id}_q${index + 1}`)).filter(Boolean) as AcademicQuestion[]
      : [];
    if (!id) return;
    next[id] = {
      id,
      courseId: stringValue(value.courseId, "soc101"),
      courseTitle: stringValue(value.courseTitle, stringValue(value.courseName, stringValue(value.courseId, "Course"))),
      label: stringValue(value.label, stringValue(value.title, id)),
      day: typeof value.day === "number" ? value.day : 1,
      startSlot: typeof value.startSlot === "number" ? value.startSlot : undefined,
      endSlot: typeof value.endSlot === "number" ? value.endSlot : undefined,
      location: stringValue(value.location, "lecture_hall"),
      baseDifficulty: typeof value.baseDifficulty === "number" ? value.baseDifficulty : 6,
      minQuestions: typeof value.minQuestions === "number" ? value.minQuestions : undefined,
      questions,
    };
  };

  if (Array.isArray(source)) {
    source.forEach((item, index) => addTest(isRecord(item) ? stringValue(item.id, `test_${index + 1}`) : `test_${index + 1}`, item));
    return next;
  }

  if (isRecord(source)) {
    Object.entries(source).forEach(([key, value]) => addTest(key, value));
  }

  return next;
}

export function normalizeBulletinPosts(source: unknown): BulletinPostDefinition[] {
  const posts: BulletinPostDefinition[] = [];

  const addPost = (key: string, value: unknown) => {
    if (!isRecord(value)) return;
    const id = stringValue(value.id, key);
    const title = stringValue(value.title);
    const body = stringValue(value.body, stringValue(value.text));
    if (!id || !title || !body) return;
    posts.push({
      id,
      kicker: stringValue(value.kicker, stringValue(value.tag, "Campus")),
      title,
      body,
      day: typeof value.day === "number" ? value.day : undefined,
      slot: typeof value.slot === "number" ? value.slot : undefined,
      action: isRecord(value.action) && typeof value.action.id === "string" && typeof value.action.label === "string"
        ? { id: value.action.id, label: value.action.label }
        : undefined,
      source: stringValue(value.source) || undefined,
    });
  };

  if (Array.isArray(source)) {
    source.forEach((item, index) => addPost(isRecord(item) ? stringValue(item.id, `bulletin_${index + 1}`) : `bulletin_${index + 1}`, item));
    return posts;
  }

  if (isRecord(source)) {
    Object.entries(source).forEach(([key, value]) => addPost(key, value));
  }

  return posts;
}

function mergeRecords<T>(base: T[] | Record<string, T> | undefined, next: Record<string, T>) {
  return { ...(Array.isArray(base) ? Object.fromEntries(base.map(item => [(item as { id?: string }).id, item]).filter(([id]) => id)) : base || {}), ...next };
}

function objectSize(value: unknown) {
  return isRecord(value) ? Object.keys(value).length : 0;
}

function arcCount(value: unknown) {
  if (Array.isArray(value)) return value.length;
  if (isRecord(value)) return Object.keys(value).length;
  return value == null ? 0 : 1;
}

function calendarEventSources(pack: WorldPack): unknown[] {
  const calendar = Array.isArray(pack.calendar)
    ? pack.calendar
    : pack.calendar && typeof pack.calendar === "object" && Array.isArray(pack.calendar.events)
      ? pack.calendar.events
      : [];
  return [
    ...(Array.isArray(pack.calendarEvents) ? pack.calendarEvents : []),
    ...calendar,
    ...(Array.isArray(pack.events) ? pack.events : []),
    ...(Array.isArray(pack.deadlines) ? pack.deadlines : []),
  ];
}

function normalizeCalendarEvents(pack: WorldPack): CalendarEvent[] {
  return calendarEventSources(pack).filter(event =>
    event
    && typeof event === "object"
    && !Array.isArray(event)
    && typeof (event as CalendarEvent).id === "string"
    && typeof (event as CalendarEvent).title === "string"
    && typeof (event as CalendarEvent).kind === "string"
    && typeof (event as CalendarEvent).day === "number"
    && typeof (event as CalendarEvent).startSlot === "number",
  ) as CalendarEvent[];
}

function normalizeRelationshipMap(source: unknown): Record<NpcId, RelationshipRecord | number | string> {
  const next: Record<NpcId, RelationshipRecord | number | string> = {};

  if (Array.isArray(source)) {
    for (const item of source) {
      if (!isRecord(item)) continue;
      const id = stringValue(item.npcId, stringValue(item.id));
      if (!id) continue;
      const record = { ...item };
      delete record.id;
      delete record.npcId;
      next[id] = record as unknown as RelationshipRecord;
    }
    return next;
  }

  if (isRecord(source)) {
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === "number" || typeof value === "string" || isRecord(value)) next[key] = value as RelationshipRecord | number | string;
    }
  }

  return next;
}

function normalizeRelationshipSeeds(pack: WorldPack): Record<NpcId, RelationshipRecord | number | string> {
  return {
    ...normalizeRelationshipMap(pack.relationships),
    ...normalizeRelationshipMap(pack.initialRelationships),
  };
}

function normalizePackAcademicCourses(pack: WorldPack): Record<string, AcademicCourseDefinition> {
  return {
    ...normalizeAcademicCourseMap(pack.academicCourses),
    ...normalizeAcademicCourseMap(pack.courses),
    ...normalizeAcademicCourseMap(pack.classes),
  };
}

function normalizePackAcademicTests(pack: WorldPack): Record<string, AcademicTestDefinition> {
  return {
    ...normalizeAcademicTestMap(pack.academicTests),
    ...normalizeAcademicTestMap(pack.tests),
  };
}

function normalizePackBulletins(pack: WorldPack): BulletinPostDefinition[] {
  const posts = [
    ...normalizeBulletinPosts(pack.bulletinPosts),
    ...normalizeBulletinPosts(pack.bulletins),
  ];
  return posts.filter((post, index, all) => all.findIndex(item => item.id === post.id) === index);
}

function scheduleBlocks(source: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(source)) return source.filter(isRecord);
  if (!isRecord(source)) return [];

  const blocks: Array<Record<string, unknown>> = [];
  for (const value of Object.values(source)) {
    if (Array.isArray(value)) blocks.push(...value.filter(isRecord));
    else if (isRecord(value)) blocks.push(value);
  }
  return blocks;
}

function hasLocationId(id: string, importedLocations: Record<LocationId, LocationDefinition>) {
  return Boolean(importedLocations[id] || LOCATIONS[id]);
}

function hasNpcId(id: string, importedNpcs: Record<NpcId, Npc>) {
  return Boolean(importedNpcs[id] || STARTER_NPCS[id]);
}

function issue(severity: WorldPackValidationSeverity, path: string, message: string): WorldPackValidationIssue {
  return { severity, path, message };
}

function packMeta(pack: WorldPack, sourceFileName?: string): WorldPackMeta {
  return {
    id: stringValue(pack.id) || undefined,
    name: stringValue(pack.name, stringValue(pack.title, sourceFileName || "Imported world pack")),
    version: stringValue(pack.version) || undefined,
    author: stringValue(pack.author) || undefined,
    description: stringValue(pack.description) || undefined,
    sourceFileName,
    importedAt: new Date().toISOString(),
  };
}

export function validateWorldPack(pack: WorldPack): WorldPackValidationIssue[] {
  const issues: WorldPackValidationIssue[] = [];
  const npcs = {
    ...normalizeNpcMap(pack.npcs),
    ...normalizeNpcMap(pack.characters),
    ...normalizeNpcMap(pack.cast),
  };
  const locations = {
    ...normalizeLocationMap(pack.locations),
    ...normalizeLocationMap(pack.places),
  };
  const schedules = { ...(isRecord(pack.schedules) ? pack.schedules : {}), ...(isRecord(pack.npcSchedules) ? pack.npcSchedules : {}) };
  const relationships = normalizeRelationshipSeeds(pack);
  const academicCourses = normalizePackAcademicCourses(pack);
  const academicTests = normalizePackAcademicTests(pack);
  const bulletinPosts = normalizePackBulletins(pack);
  const knownLocationIds = normalizeIdList(pack.knownLocationIds);
  const rumoredLocationIds = normalizeIdList(pack.rumoredLocationIds);
  const calendarSources = calendarEventSources(pack);
  const validCalendarEvents = normalizeCalendarEvents(pack);
  const importableCount = Object.keys(npcs).length
    + Object.keys(locations).length
    + Object.keys(schedules).length
    + validCalendarEvents.length
    + arcCount(pack.arcs ?? pack.storyArcs)
    + Object.keys(relationships).length
    + Object.keys(academicCourses).length
    + Object.keys(academicTests).length
    + bulletinPosts.length
    + knownLocationIds.length
    + rumoredLocationIds.length;

  if (!importableCount) {
    issues.push(issue("error", "$", "Pack did not contain importable NPCs, locations, schedules, relationships, courses, tests, bulletin posts, calendar events, arcs, or discovery seeds."));
  }

  for (const [npcId, npc] of Object.entries(npcs)) {
    const locationId = npc.defaultLocation || npc.currentLocation || npc.location;
    if (locationId && !hasLocationId(locationId, locations)) {
      issues.push(issue("warning", `npcs.${npcId}`, `NPC references unknown location "${locationId}". Add it to locations or use a built-in location id.`));
    }
    if (!npc.schema) {
      issues.push(issue("warning", `npcs.${npcId}.schema`, "NPC has no schema; narrator and Roster detail will be thinner."));
    }
  }

  for (const [locationId, location] of Object.entries(locations)) {
    if (!location.description) {
      issues.push(issue("warning", `locations.${locationId}.description`, "Location has no description."));
    }
  }

  for (const [npcId, source] of Object.entries(schedules)) {
    for (const block of scheduleBlocks(source)) {
      const locationId = typeof block.location === "string" ? block.location : "";
      if (!locationId) {
        issues.push(issue("warning", `schedules.${npcId}`, "Schedule block has no location and will be ignored by NPC scheduling."));
      } else if (!hasLocationId(locationId, locations)) {
        issues.push(issue("warning", `schedules.${npcId}`, `Schedule references unknown location "${locationId}".`));
      }
    }
  }

  for (const locationId of [...knownLocationIds, ...rumoredLocationIds]) {
    if (!hasLocationId(locationId, locations)) {
      issues.push(issue("warning", "knownLocationIds", `Discovery seed references unknown location "${locationId}".`));
    }
  }

  for (const npcId of Object.keys(relationships)) {
    if (!hasNpcId(npcId, npcs)) {
      issues.push(issue("warning", `relationships.${npcId}`, `Relationship seed references unknown NPC "${npcId}".`));
    }
  }

  for (const [courseId, course] of Object.entries(academicCourses)) {
    if (!course.code || !course.title) {
      issues.push(issue("warning", `courses.${courseId}`, "Course is missing code or title."));
    }
    if (course.location && !hasLocationId(course.location, locations)) {
      issues.push(issue("warning", `courses.${courseId}.location`, `Course references unknown location "${course.location}".`));
    }
    if (!course.meetingDays.length) {
      issues.push(issue("warning", `courses.${courseId}.meetingDays`, "Course has no meeting days, so it will not create class rhythm by itself."));
    }
  }

  for (const [testId, test] of Object.entries(academicTests)) {
    if (!academicCourses[test.courseId] && test.courseId !== "soc101") {
      issues.push(issue("warning", `tests.${testId}.courseId`, `Test references course "${test.courseId}" that is not defined in this pack or built in.`));
    }
    if (test.location && !hasLocationId(test.location, locations)) {
      issues.push(issue("warning", `tests.${testId}.location`, `Test references unknown location "${test.location}".`));
    }
    if (!test.questions.length) {
      issues.push(issue("error", `tests.${testId}.questions`, "Test has no valid questions and cannot be used by Spark."));
    }
    for (const [index, question] of test.questions.entries()) {
      const questionPath = `tests.${testId}.questions.${index}`;
      if ((question.type === "short_text" || question.type === "multi_select" || question.type === "order") && !question.correctAnswers?.length) {
        issues.push(issue("warning", `${questionPath}.correctAnswers`, "Question type should define correctAnswers."));
      }
      if ((question.type === "multiple_choice" || !question.type) && !question.options?.some(option => option.correct)) {
        issues.push(issue("warning", `${questionPath}.options`, "Multiple-choice question has no option marked correct."));
      }
    }
  }

  for (const [index, post] of bulletinPosts.entries()) {
    if (!post.title || !post.body) {
      issues.push(issue("warning", `bulletinPosts.${index}`, "Bulletin post is missing title or body."));
    }
  }

  for (let index = 0; index < calendarSources.length; index += 1) {
    const rawEvent = calendarSources[index];
    if (!isRecord(rawEvent)) {
      issues.push(issue("warning", `calendarEvents.${index}`, "Calendar event is not an object and will be ignored."));
      continue;
    }
    if (typeof rawEvent.id !== "string" || typeof rawEvent.title !== "string" || typeof rawEvent.kind !== "string" || typeof rawEvent.day !== "number" || typeof rawEvent.startSlot !== "number") {
      issues.push(issue("warning", `calendarEvents.${index}`, "Calendar event is missing id, title, kind, day, or startSlot and will be ignored."));
      continue;
    }
    if (typeof rawEvent.location === "string" && !hasLocationId(rawEvent.location, locations)) {
      issues.push(issue("warning", `calendarEvents.${index}.location`, `Calendar event references unknown location "${rawEvent.location}".`));
    }
  }

  return issues;
}

export function summarizeWorldPack(pack: WorldPack, sourceFileName?: string): WorldPackImportSummary {
  const npcs = {
    ...normalizeNpcMap(pack.npcs),
    ...normalizeNpcMap(pack.characters),
    ...normalizeNpcMap(pack.cast),
  };
  const locations = {
    ...normalizeLocationMap(pack.locations),
    ...normalizeLocationMap(pack.places),
  };
  const schedules = { ...(pack.schedules || {}), ...(pack.npcSchedules || {}) };
  const arcs = pack.arcs ?? pack.storyArcs;
  const calendarEvents = normalizeCalendarEvents(pack);
  const relationships = normalizeRelationshipSeeds(pack);
  const academicCourses = normalizePackAcademicCourses(pack);
  const academicTests = normalizePackAcademicTests(pack);
  const bulletinPosts = normalizePackBulletins(pack);
  const knownLocationIds = normalizeIdList(pack.knownLocationIds);
  const rumoredLocationIds = normalizeIdList(pack.rumoredLocationIds);
  const issues = validateWorldPack(pack);

  return {
    name: packMeta(pack, sourceFileName).name || "Imported world pack",
    npcCount: Object.keys(npcs).length,
    locationCount: Object.keys(locations).length,
    scheduleCount: objectSize(schedules),
    arcCount: arcCount(arcs),
    eventCount: calendarEvents.length,
    courseCount: Object.keys(academicCourses).length,
    testCount: Object.keys(academicTests).length,
    bulletinCount: bulletinPosts.length,
    relationshipCount: Object.keys(relationships).length,
    knownLocationCount: knownLocationIds.length,
    rumoredLocationCount: rumoredLocationIds.length,
    warningCount: issues.filter(item => item.severity === "warning").length,
    errorCount: issues.filter(item => item.severity === "error").length,
    issues,
  };
}

export function worldPackErrorMessage(summary: WorldPackImportSummary) {
  const errors = summary.issues.filter(item => item.severity === "error");
  if (!errors.length) return "";
  return `World pack "${summary.name}" has ${errors.length} import error${errors.length === 1 ? "" : "s"}: ${errors.map(item => `${item.path} - ${item.message}`).join("; ")}`;
}

function nextDiscoveryState(current: LocationKnowledgeRecord | undefined, target: LocationDiscoveryState) {
  const currentState = current?.state || "unknown";
  return DISCOVERY_RANK[target] > DISCOVERY_RANK[currentState] ? target : currentState;
}

function mergeLocationKnowledge(
  state: GameState,
  knownLocationIds: LocationId[],
  rumoredLocationIds: LocationId[],
  source: string,
): Record<LocationId, LocationKnowledgeRecord> {
  const next = { ...(state.locationKnowledge || {}) };

  const mark = (locationId: LocationId, target: Exclude<LocationDiscoveryState, "unknown" | "visited">) => {
    const current = next[locationId];
    const stateAfterImport = nextDiscoveryState(current, target);
    next[locationId] = {
      ...current,
      state: stateAfterImport,
      discoveredDay: current?.discoveredDay ?? state.day,
      discoveredSlot: current?.discoveredSlot ?? state.timeSlot,
      source: current?.source || source,
      isNew: stateAfterImport !== "visited" && current?.state !== stateAfterImport,
      hoursKnown: stateAfterImport === "known" ? true : Boolean(current?.hoursKnown),
    };
  };

  rumoredLocationIds.forEach(locationId => mark(locationId, "rumored"));
  knownLocationIds.forEach(locationId => mark(locationId, "known"));

  return next;
}

export function applyWorldPack(state: GameState, pack: WorldPack, sourceFileName?: string) {
  const importedNpcs = {
    ...normalizeNpcMap(pack.npcs),
    ...normalizeNpcMap(pack.characters),
    ...normalizeNpcMap(pack.cast),
  };
  const importedLocations = {
    ...normalizeLocationMap(pack.locations),
    ...normalizeLocationMap(pack.places),
  };
  const importedSchedules = { ...(pack.schedules || {}), ...(pack.npcSchedules || {}) };
  const importedArcs = pack.arcs ?? pack.storyArcs;
  const importedCalendarEvents = normalizeCalendarEvents(pack);
  const importedRelationships = normalizeRelationshipSeeds(pack);
  const importedAcademicCourses = normalizePackAcademicCourses(pack);
  const importedAcademicTests = normalizePackAcademicTests(pack);
  const importedBulletins = normalizePackBulletins(pack);
  const knownLocationIds = normalizeIdList(pack.knownLocationIds);
  const rumoredLocationIds = normalizeIdList(pack.rumoredLocationIds);
  const meta = packMeta(pack, sourceFileName);
  const summary = summarizeWorldPack(pack, sourceFileName);
  if (summary.errorCount) throw new Error(worldPackErrorMessage(summary));
  const existingPackMeta = state.world?.packMeta || [];
  const packMetaKey = meta.id || meta.sourceFileName || meta.name;
  const nextPackMeta = [
    ...existingPackMeta.filter(item => (item.id || item.sourceFileName || item.name) !== packMetaKey),
    meta,
  ];
  const relationshipSeeds = Object.fromEntries(
    Object.entries(importedRelationships).map(([npcId, record]) => [npcId, normalizeRelationshipRecord(record, npcId)]),
  );

  const nextState: GameState = {
    ...state,
    player: {
      ...state.player,
      relationships: {
        ...(state.player.relationships || {}),
        ...relationshipSeeds,
      },
    },
    locationKnowledge: mergeLocationKnowledge(state, knownLocationIds, rumoredLocationIds, `World pack: ${meta.name || sourceFileName || "import"}`),
    npcDirectory: {
      ...(state.npcDirectory || {}),
      ...importedNpcs,
    },
    npcsKnown: [...new Set([...(state.npcsKnown || []), ...(Array.isArray(pack.knownNpcIds) ? pack.knownNpcIds : [])])],
    flags: {
      ...(state.flags || {}),
      ...(pack.flags || {}),
    },
    world: {
      ...(state.world || {}),
      npcs: mergeRecords(state.world?.npcs, importedNpcs),
      locations: mergeRecords(state.world?.locations, importedLocations),
      schedules: {
        ...(state.world?.schedules || {}),
        ...(pack.schedules || {}),
      },
      npcSchedules: {
        ...(state.world?.npcSchedules || {}),
        ...(pack.npcSchedules || {}),
      },
      academicCourses: mergeRecords(state.world?.academicCourses, importedAcademicCourses),
      courses: mergeRecords(state.world?.courses, importedAcademicCourses),
      academicTests: mergeRecords(state.world?.academicTests, importedAcademicTests),
      tests: mergeRecords(state.world?.tests, importedAcademicTests),
      calendarEvents: [
        ...(state.world?.calendarEvents || []).filter(event => !importedCalendarEvents.some(imported => imported.id === event.id)),
        ...importedCalendarEvents,
      ],
      bulletinPosts: [
        ...normalizeBulletinPosts(state.world?.bulletinPosts).filter(post => !importedBulletins.some(imported => imported.id === post.id)),
        ...importedBulletins,
      ],
      bulletins: [
        ...normalizeBulletinPosts(state.world?.bulletins).filter(post => !importedBulletins.some(imported => imported.id === post.id)),
        ...importedBulletins,
      ],
      arcs: importedArcs ?? state.world?.arcs,
      storyArcs: importedArcs ?? state.world?.storyArcs,
      packMeta: nextPackMeta,
    },
  };

  return {
    state: appendEvent(
      nextState,
      `Imported world pack "${summary.name}" (${summary.npcCount} NPCs, ${summary.locationCount} locations, ${summary.relationshipCount} relationships, ${summary.courseCount} courses, ${summary.testCount} tests, ${summary.bulletinCount} bulletins, ${summary.scheduleCount} schedules, ${summary.eventCount} calendar events, ${summary.arcCount} arcs${summary.warningCount ? `, ${summary.warningCount} warnings` : ""}).`,
    ),
    summary,
  };
}

export function buildWorldPackFromState(state: GameState): WorldPack {
  const knownLocationIds = Object.entries(state.locationKnowledge || {})
    .filter(([, record]) => record.state === "known" || record.state === "visited")
    .map(([locationId]) => locationId);
  const rumoredLocationIds = Object.entries(state.locationKnowledge || {})
    .filter(([, record]) => record.state === "rumored")
    .map(([locationId]) => locationId);

  return {
    id: `current-world-${state.day}-${state.timeSlot}`,
    name: "Current World Export",
    version: "0.1.0",
    author: "Student Body local export",
    description: "Exported from the current local game state.",
    npcs: {
      ...normalizeNpcMap(state.world?.npcs),
      ...(state.npcDirectory || {}),
    },
    locations: normalizeLocationMap(state.world?.locations),
    schedules: state.world?.schedules || {},
    npcSchedules: state.world?.npcSchedules || {},
    academicCourses: normalizeAcademicCourseMap(state.world?.academicCourses || state.world?.courses || state.world?.classes),
    academicTests: normalizeAcademicTestMap(state.world?.academicTests || state.world?.tests),
    calendarEvents: state.world?.calendarEvents || [],
    bulletinPosts: normalizeBulletinPosts(state.world?.bulletinPosts || state.world?.bulletins),
    arcs: state.world?.arcs,
    storyArcs: state.world?.storyArcs,
    knownNpcIds: state.npcsKnown || [],
    knownLocationIds,
    rumoredLocationIds,
    relationships: state.player.relationships || {},
    flags: state.flags || {},
  };
}
