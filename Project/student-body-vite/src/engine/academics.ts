import { ACADEMIC_COURSES, ACADEMIC_TESTS, DEFAULT_COURSE_ID } from "../data/academics";
import { timeChunk } from "../data/locations";
import type {
  AcademicAnswerValue,
  AcademicCourseRecord,
  AcademicPrepRecord,
  AcademicQuestion,
  AcademicTestDefinition,
  AcademicTestOutcome,
  AcademicTestResult,
  GameState,
  GameUpdate,
} from "../types/game";
import { appendEvent } from "./state";

export type AcademicTestTimingStatus = "upcoming" | "starts_now" | "in_progress" | "late";

export interface AcademicTestTiming {
  status: AcademicTestTimingStatus;
  startSlot: number;
  endSlot: number;
  isAvailable: boolean;
  isActive: boolean;
  pressureLabel: string;
}

export interface AcademicDifficulty {
  prepScore: number;
  difficulty: number;
  threshold: number;
  hintUnlocked: boolean;
  hintCount: number;
  questionCount: number;
  curveBonus: number;
  timing: AcademicTestTiming;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function arraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameSet(left: string[], right: string[]) {
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return arraysEqual(sortedLeft, sortedRight);
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function answerValues(value: AcademicAnswerValue | undefined) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

export function getPrepRecord(state: GameState, courseId = DEFAULT_COURSE_ID): AcademicPrepRecord {
  return state.academics?.prep?.[courseId] || { studyChunks: 0, reviewChunks: 0, focus: 0, history: [] };
}

export function getCourseRecord(state: GameState, courseId = DEFAULT_COURSE_ID): AcademicCourseRecord {
  return state.academics?.courses?.[courseId] || {
    courseId,
    standing: 70,
    highScores: 0,
    passes: 0,
    partials: 0,
    failures: 0,
    flags: [],
  };
}

export function getCourseDefinition(courseId = DEFAULT_COURSE_ID) {
  return ACADEMIC_COURSES.find(course => course.id === courseId) || ACADEMIC_COURSES[0];
}

export function getCourseTests(courseId = DEFAULT_COURSE_ID) {
  return ACADEMIC_TESTS.filter(test => test.courseId === courseId);
}

export function addAcademicPrep(
  state: GameState,
  courseId = DEFAULT_COURSE_ID,
  changes: Partial<Pick<AcademicPrepRecord, "studyChunks" | "reviewChunks" | "focus">>,
): GameState {
  const current = getPrepRecord(state, courseId);
  const entry = {
    day: state.day,
    slot: state.timeSlot,
    studyChunks: changes.studyChunks || 0,
    reviewChunks: changes.reviewChunks || 0,
    focus: changes.focus || 0,
  };
  return {
    ...state,
    academics: {
      prep: {
        ...(state.academics?.prep || {}),
        [courseId]: {
          ...current,
          studyChunks: Math.max(0, current.studyChunks + entry.studyChunks),
          reviewChunks: Math.max(0, current.reviewChunks + entry.reviewChunks),
          focus: clamp(current.focus + entry.focus, 0, 20),
          history: [...(current.history || []), entry].slice(-12),
          lastStudiedDay: state.day,
          lastStudiedSlot: state.timeSlot,
        },
      },
      completedTests: state.academics?.completedTests || {},
      courses: state.academics?.courses || {},
    },
  };
}

export function getCompletedTest(state: GameState, testId: string) {
  const result = state.academics?.completedTests?.[testId];
  if (!result) return undefined;
  const outcome = result.outcome || (result.passed ? "passed" : "failed");
  const total = result.total || result.answers?.length || 1;
  return {
    ...result,
    outcome,
    percentage: result.percentage ?? Math.round(((result.correct || 0) / total) * 100),
    curveBonus: result.curveBonus ?? 0,
    courseStanding: result.courseStanding ?? getCourseRecord(state, result.courseId).standing,
    consequences: result.consequences || [],
  };
}

export function getTestTiming(state: GameState, test: AcademicTestDefinition): AcademicTestTiming {
  const startSlot = test.startSlot ?? timeChunk(10);
  const endSlot = test.endSlot ?? startSlot + 4;
  const beforeDay = state.day < test.day;
  const afterDay = state.day > test.day;
  const beforeStart = state.day === test.day && state.timeSlot < startSlot;
  const afterEnd = state.day === test.day && state.timeSlot >= endSlot;
  const isActive = state.day === test.day && state.timeSlot >= startSlot && state.timeSlot < endSlot;

  if (beforeDay || beforeStart) {
    return { status: "upcoming", startSlot, endSlot, isAvailable: false, isActive: false, pressureLabel: "upcoming" };
  }

  if (isActive) {
    const status = state.timeSlot === startSlot ? "starts_now" : "in_progress";
    return {
      status,
      startSlot,
      endSlot,
      isAvailable: true,
      isActive: true,
      pressureLabel: status === "starts_now" ? "starts now" : "in progress",
    };
  }

  if (afterDay || afterEnd) {
    return { status: "late", startSlot, endSlot, isAvailable: true, isActive: false, pressureLabel: "late" };
  }

  return { status: "upcoming", startSlot, endSlot, isAvailable: false, isActive: false, pressureLabel: "upcoming" };
}

export function testIsAvailable(state: GameState, test: AcademicTestDefinition) {
  return getTestTiming(state, test).isAvailable && !getCompletedTest(state, test.id);
}

export function getNextAcademicTest(state: GameState) {
  return ACADEMIC_TESTS.find(test => !getCompletedTest(state, test.id) && getTestTiming(state, test).status !== "late")
    || ACADEMIC_TESTS.find(test => !getCompletedTest(state, test.id))
    || ACADEMIC_TESTS[ACADEMIC_TESTS.length - 1];
}

export function calculateAcademicDifficulty(state: GameState, test: AcademicTestDefinition): AcademicDifficulty {
  const prep = getPrepRecord(state, test.courseId);
  const history = prep.history || [];
  const recentStudy = history.filter(entry => state.day - entry.day <= 3).length;
  const studyScore = Math.floor(prep.studyChunks / 3);
  const reviewScore = Math.floor(prep.reviewChunks / 2);
  const focusScore = Math.floor(prep.focus / 4);
  const historyScore = Math.min(2, Math.floor(history.length / 2)) + Math.min(2, recentStudy);
  const knowledgeScore = Math.floor(Math.max(0, state.player.stats.knowledge - 30) / 12);
  const gritScore = Math.floor(Math.max(0, state.player.stats.grit - 30) / 18);
  const prepScore = clamp(studyScore + reviewScore + focusScore + historyScore + knowledgeScore + gritScore, 0, 12);
  const timing = getTestTiming(state, test);
  const latePenalty = timing.status === "late" ? 1 : 0;
  const difficulty = clamp(test.baseDifficulty + latePenalty - Math.floor(prepScore / 2), 1, 10);
  const maxQuestions = test.questions.length;
  const minQuestions = Math.min(maxQuestions, test.minQuestions || Math.ceil(maxQuestions * 0.7));
  const questionCount = clamp(maxQuestions - Math.floor(prepScore / 5), minQuestions, maxQuestions);
  const curveBonus = prepScore >= 8 ? 1 : 0;
  const threshold = clamp(
    Math.ceil(questionCount * 0.62) + Math.floor(difficulty / 4) - Math.floor(prepScore / 5),
    1,
    questionCount,
  );
  const hintCount = prepScore >= 7 ? questionCount : prepScore >= 4 ? Math.ceil(questionCount / 2) : prepScore >= 2 ? 1 : 0;

  return {
    prepScore,
    difficulty,
    threshold,
    hintUnlocked: hintCount > 0,
    hintCount,
    questionCount,
    curveBonus,
    timing,
  };
}

export function getResolvedAcademicQuestions(state: GameState, test: AcademicTestDefinition): AcademicQuestion[] {
  const difficulty = calculateAcademicDifficulty(state, test);
  return test.questions.slice(0, difficulty.questionCount);
}

function questionIsCorrect(question: AcademicQuestion, value: AcademicAnswerValue | undefined) {
  const type = question.type || "multiple_choice";
  const values = answerValues(value);

  if (type === "multiple_choice") {
    const answerId = typeof value === "string" ? value : values[0] || "";
    return Boolean(question.options?.find(option => option.id === answerId)?.correct);
  }

  if (type === "multi_select") {
    const correct = question.correctAnswers || question.options?.filter(option => option.correct).map(option => option.id) || [];
    return correct.length > 0 && sameSet(values, correct);
  }

  if (type === "order") {
    return arraysEqual(values, question.correctAnswers || []);
  }

  const response = normalizeText(typeof value === "string" ? value : values.join(" "));
  return (question.correctAnswers || []).some(answer => {
    const normalizedAnswer = normalizeText(answer);
    return response === normalizedAnswer || response.includes(normalizedAnswer);
  });
}

function gradeLetter(ratio: number, passed: boolean) {
  if (ratio >= 0.92) return "A";
  if (ratio >= 0.82) return "B";
  if (ratio >= 0.7) return "C";
  if (passed) return "D";
  return "F";
}

function outcomeFor(effectiveCorrect: number, rawCorrect: number, total: number, threshold: number): AcademicTestOutcome {
  const ratio = total ? effectiveCorrect / total : 0;
  if (ratio >= 0.9) return "high";
  if (effectiveCorrect >= threshold) return "passed";
  if (rawCorrect >= Math.max(1, threshold - 1) || ratio >= 0.5) return "partial";
  return "failed";
}

function updateCourseRecord(record: AcademicCourseRecord, result: AcademicTestResult): AcademicCourseRecord {
  const standingDelta = result.outcome === "high" ? 8 : result.outcome === "passed" ? 5 : result.outcome === "partial" ? 1 : -8;
  const flags = new Set(record.flags || []);
  if (result.outcome === "high") flags.add("academic_momentum");
  if (result.outcome === "partial") flags.add("review_recommended");
  if (result.outcome === "failed") flags.add("office_hours_recommended");

  return {
    ...record,
    standing: clamp(record.standing + standingDelta, 0, 100),
    highScores: record.highScores + (result.outcome === "high" ? 1 : 0),
    passes: record.passes + (result.outcome === "passed" || result.outcome === "high" ? 1 : 0),
    partials: record.partials + (result.outcome === "partial" ? 1 : 0),
    failures: record.failures + (result.outcome === "failed" ? 1 : 0),
    lastGrade: result.grade,
    flags: [...flags],
  };
}

function consequencesFor(result: AcademicTestResult) {
  if (result.outcome === "high") return ["Strong score raised course standing.", "Academic momentum trait gained.", "Lower energy cost from confidence."];
  if (result.outcome === "passed") return ["Course standing improved.", "Knowledge increased.", "The test still cost energy."];
  if (result.outcome === "partial") return ["Partial credit kept you afloat.", "Course standing barely improved.", "Review is recommended."];
  return ["Course standing dropped.", "Office hours are recommended.", "The test hit energy hard."];
}

export function submitAcademicTest(
  state: GameState,
  testId: string,
  selectedAnswers: Record<string, AcademicAnswerValue>,
): GameUpdate & { result?: AcademicTestResult } {
  const test = ACADEMIC_TESTS.find(item => item.id === testId);
  if (!test) return { state };
  const existing = getCompletedTest(state, test.id);
  if (existing) return { state, result: existing };
  if (!testIsAvailable(state, test)) return { state };

  const difficulty = calculateAcademicDifficulty(state, test);
  const questions = getResolvedAcademicQuestions(state, test);
  const answers = questions.map(question => {
    const value = selectedAnswers[question.id];
    const values = answerValues(value);
    return {
      questionId: question.id,
      answerId: typeof value === "string" ? value : values[0],
      answerIds: Array.isArray(value) ? value : undefined,
      value,
      correct: questionIsCorrect(question, value),
    };
  });
  const rawCorrect = answers.filter(answer => answer.correct).length;
  const effectiveCorrect = clamp(rawCorrect + difficulty.curveBonus, 0, questions.length);
  const outcome = outcomeFor(effectiveCorrect, rawCorrect, questions.length, difficulty.threshold);
  const passed = outcome === "passed" || outcome === "high";
  const percentage = questions.length ? Math.round((effectiveCorrect / questions.length) * 100) : 0;
  const courseRecord = getCourseRecord(state, test.courseId);
  const resultDraft = {
    testId: test.id,
    courseId: test.courseId,
    day: state.day,
    slot: state.timeSlot,
    correct: effectiveCorrect,
    total: questions.length,
    threshold: difficulty.threshold,
    passed,
    grade: gradeLetter(effectiveCorrect / Math.max(1, questions.length), outcome !== "failed"),
    outcome,
    percentage,
    prepScore: difficulty.prepScore,
    difficulty: difficulty.difficulty,
    curveBonus: difficulty.curveBonus,
    courseStanding: courseRecord.standing,
    consequences: [],
    answers,
  } satisfies AcademicTestResult;
  const updatedCourse = updateCourseRecord(courseRecord, resultDraft);
  const result: AcademicTestResult = {
    ...resultDraft,
    courseStanding: updatedCourse.standing,
    consequences: consequencesFor(resultDraft),
  };

  const traits = new Set(state.player.traits || []);
  if (result.outcome === "high") traits.add("academic-momentum");
  if (result.outcome === "failed") traits.add("needs-review");
  const knowledgeGain = result.outcome === "high" ? 5 : result.outcome === "passed" ? 3 : result.outcome === "partial" ? 1 : 0;
  const gritGain = result.outcome === "failed" || result.outcome === "partial" ? 2 : 1;
  const energyCost = result.outcome === "high" ? 6 : result.outcome === "passed" ? 8 : result.outcome === "partial" ? 12 : 16;
  const nextStats = {
    ...state.player.stats,
    knowledge: clamp(state.player.stats.knowledge + knowledgeGain, 0, 100),
    grit: clamp(state.player.stats.grit + gritGain, 0, 100),
  };
  const nextResources = {
    ...state.player.resources,
    energy: clamp(state.player.resources.energy - energyCost, 0, 100),
  };
  const withResult: GameState = {
    ...state,
    player: {
      ...state.player,
      stats: nextStats,
      resources: nextResources,
      traits: [...traits],
    },
    academics: {
      prep: state.academics?.prep || {},
      completedTests: {
        ...(state.academics?.completedTests || {}),
        [test.id]: result,
      },
      courses: {
        ...(state.academics?.courses || {}),
        [test.courseId]: updatedCourse,
      },
    },
  };
  const nextState = appendEvent(
    withResult,
    `${result.outcome === "high" ? "Aced" : passed ? "Passed" : result.outcome === "partial" ? "Partially passed" : "Failed"} ${test.courseTitle} ${test.label}: ${effectiveCorrect}/${questions.length}, grade ${result.grade}.`,
  );

  return {
    state: nextState,
    result,
    notification: {
      app: "Spark",
      body: `${test.label}: ${result.grade} (${result.outcome}, ${effectiveCorrect}/${questions.length}).`,
    },
  };
}
