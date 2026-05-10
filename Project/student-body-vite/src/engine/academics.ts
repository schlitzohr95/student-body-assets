import { ACADEMIC_TESTS, DEFAULT_COURSE_ID } from "../data/academics";
import type { AcademicPrepRecord, AcademicTestDefinition, AcademicTestResult, GameState, GameUpdate } from "../types/game";
import { appendEvent } from "./state";

export interface AcademicDifficulty {
  prepScore: number;
  difficulty: number;
  threshold: number;
  hintUnlocked: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getPrepRecord(state: GameState, courseId = DEFAULT_COURSE_ID): AcademicPrepRecord {
  return state.academics?.prep?.[courseId] || { studyChunks: 0, reviewChunks: 0, focus: 0 };
}

export function addAcademicPrep(
  state: GameState,
  courseId = DEFAULT_COURSE_ID,
  changes: Partial<Pick<AcademicPrepRecord, "studyChunks" | "reviewChunks" | "focus">>,
): GameState {
  const current = getPrepRecord(state, courseId);
  return {
    ...state,
    academics: {
      prep: {
        ...(state.academics?.prep || {}),
        [courseId]: {
          ...current,
          studyChunks: Math.max(0, current.studyChunks + (changes.studyChunks || 0)),
          reviewChunks: Math.max(0, current.reviewChunks + (changes.reviewChunks || 0)),
          focus: clamp(current.focus + (changes.focus || 0), 0, 20),
          lastStudiedDay: state.day,
          lastStudiedSlot: state.timeSlot,
        },
      },
      completedTests: state.academics?.completedTests || {},
    },
  };
}

export function getCompletedTest(state: GameState, testId: string) {
  return state.academics?.completedTests?.[testId];
}

export function testIsAvailable(state: GameState, test: AcademicTestDefinition) {
  return state.day >= test.day && !getCompletedTest(state, test.id);
}

export function getNextAcademicTest(state: GameState) {
  return ACADEMIC_TESTS.find(test => !getCompletedTest(state, test.id) && test.day >= state.day)
    || ACADEMIC_TESTS.find(test => !getCompletedTest(state, test.id))
    || ACADEMIC_TESTS[ACADEMIC_TESTS.length - 1];
}

export function calculateAcademicDifficulty(state: GameState, test: AcademicTestDefinition): AcademicDifficulty {
  const prep = getPrepRecord(state, test.courseId);
  const studyScore = Math.floor(prep.studyChunks / 3);
  const reviewScore = Math.floor(prep.reviewChunks / 2);
  const focusScore = Math.floor(prep.focus / 4);
  const knowledgeScore = Math.floor(Math.max(0, state.player.stats.knowledge - 30) / 12);
  const gritScore = Math.floor(Math.max(0, state.player.stats.grit - 30) / 18);
  const prepScore = clamp(studyScore + reviewScore + focusScore + knowledgeScore + gritScore, 0, 10);
  const difficulty = clamp(test.baseDifficulty - Math.floor(prepScore / 2), 1, 10);
  const threshold = clamp(Math.ceil(test.questions.length * 0.65) + Math.floor(difficulty / 4) - Math.floor(prepScore / 4), 1, test.questions.length);

  return {
    prepScore,
    difficulty,
    threshold,
    hintUnlocked: prepScore >= 3 || state.player.stats.knowledge >= 38,
  };
}

function gradeLetter(correct: number, total: number, passed: boolean) {
  const ratio = total ? correct / total : 0;
  if (ratio >= 0.9) return "A";
  if (ratio >= 0.8) return "B";
  if (ratio >= 0.7) return "C";
  if (passed) return "D";
  return "F";
}

function statGainForResult(result: AcademicTestResult) {
  if (result.grade === "A") return 4;
  if (result.grade === "B") return 3;
  if (result.passed) return 2;
  return 1;
}

export function submitAcademicTest(state: GameState, testId: string, selectedAnswers: Record<string, string>): GameUpdate & { result?: AcademicTestResult } {
  const test = ACADEMIC_TESTS.find(item => item.id === testId);
  if (!test) return { state };
  const existing = getCompletedTest(state, test.id);
  if (existing) return { state, result: existing };

  const difficulty = calculateAcademicDifficulty(state, test);
  const answers = test.questions.map(question => {
    const answerId = selectedAnswers[question.id] || "";
    const selected = question.options.find(option => option.id === answerId);
    return {
      questionId: question.id,
      answerId,
      correct: Boolean(selected?.correct),
    };
  });
  const correct = answers.filter(answer => answer.correct).length;
  const passed = correct >= difficulty.threshold;
  const result: AcademicTestResult = {
    testId: test.id,
    courseId: test.courseId,
    day: state.day,
    slot: state.timeSlot,
    correct,
    total: test.questions.length,
    threshold: difficulty.threshold,
    passed,
    grade: gradeLetter(correct, test.questions.length, passed),
    prepScore: difficulty.prepScore,
    difficulty: difficulty.difficulty,
    answers,
  };

  const gain = statGainForResult(result);
  const nextStats = {
    ...state.player.stats,
    knowledge: clamp(state.player.stats.knowledge + gain, 0, 100),
    grit: clamp(state.player.stats.grit + (passed ? 1 : 2), 0, 100),
  };
  const nextResources = {
    ...state.player.resources,
    energy: clamp(state.player.resources.energy - (passed ? 8 : 12), 0, 100),
  };
  const withResult: GameState = {
    ...state,
    player: {
      ...state.player,
      stats: nextStats,
      resources: nextResources,
    },
    academics: {
      prep: state.academics?.prep || {},
      completedTests: {
        ...(state.academics?.completedTests || {}),
        [test.id]: result,
      },
    },
  };
  const nextState = appendEvent(
    withResult,
    `${passed ? "Passed" : "Struggled through"} ${test.courseTitle} ${test.label}: ${correct}/${test.questions.length}, grade ${result.grade}.`,
  );

  return {
    state: nextState,
    result,
    notification: {
      app: "Spark",
      body: `${test.label}: ${result.grade} (${correct}/${test.questions.length}).`,
    },
  };
}
