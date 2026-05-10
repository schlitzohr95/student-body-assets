import { useMemo, useState } from "react";
import { ACADEMIC_COURSES, ACADEMIC_TESTS } from "../../data/academics";
import { getLocationDirectory } from "../../engine/calendar";
import {
  calculateAcademicDifficulty,
  getCompletedTest,
  getCourseRecord,
  getCourseTests,
  getNextAcademicTest,
  getPrepRecord,
  getResolvedAcademicQuestions,
  getTestTiming,
  testIsAvailable,
} from "../../engine/academics";
import type { AcademicAnswerValue, AcademicQuestion, AcademicTestDefinition, AcademicTestResult, GameState } from "../../types/game";
import { formatMoment } from "../format";

interface SparkAppProps {
  state: GameState;
  onSubmitTest: (testId: string, answers: Record<string, AcademicAnswerValue>) => AcademicTestResult | null;
}

function testStatus(state: GameState, test: AcademicTestDefinition) {
  const completed = getCompletedTest(state, test.id);
  if (completed) return `${completed.grade} (${completed.outcome})`;
  const timing = getTestTiming(state, test);
  if (timing.status === "starts_now") return "starts now";
  if (timing.status === "in_progress") return "in progress";
  if (timing.status === "late") return "late";
  return `day ${test.day}`;
}

function answerComplete(question: AcademicQuestion, answer: AcademicAnswerValue | undefined) {
  const type = question.type || "multiple_choice";
  if (type === "short_text") return typeof answer === "string" && answer.trim().length > 0;
  if (type === "multi_select") return Array.isArray(answer) && answer.length > 0;
  if (type === "order") return Array.isArray(answer) && answer.length === (question.options?.length || 0);
  return typeof answer === "string" && answer.length > 0;
}

function toggleValue(current: AcademicAnswerValue | undefined, optionId: string) {
  const values = Array.isArray(current) ? current : [];
  return values.includes(optionId) ? values.filter(value => value !== optionId) : [...values, optionId];
}

function moveOrderedValue(current: AcademicAnswerValue | undefined, optionIds: string[], optionId: string, direction: -1 | 1) {
  const values = Array.isArray(current) ? [...current] : [...optionIds];
  const index = values.indexOf(optionId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= values.length) return values;
  [values[index], values[nextIndex]] = [values[nextIndex], values[index]];
  return values;
}

function QuestionInput({
  question,
  answer,
  disabled,
  onAnswer,
}: {
  question: AcademicQuestion;
  answer: AcademicAnswerValue | undefined;
  disabled: boolean;
  onAnswer: (value: AcademicAnswerValue) => void;
}) {
  const type = question.type || "multiple_choice";
  const options = question.options || [];

  if (type === "short_text") {
    return (
      <input
        className="spark-text-answer"
        type="text"
        value={typeof answer === "string" ? answer : ""}
        placeholder="Type your answer"
        disabled={disabled}
        onChange={event => onAnswer(event.currentTarget.value)}
      />
    );
  }

  if (type === "multi_select") {
    const values = Array.isArray(answer) ? answer : [];
    return (
      <div className="spark-option-list">
        {options.map(option => {
          const checked = values.includes(option.id);
          return (
            <label className={`spark-option ${checked ? "is-selected" : ""}`} key={option.id}>
              <input
                type="checkbox"
                value={option.id}
                checked={checked}
                disabled={disabled}
                onChange={() => onAnswer(toggleValue(answer, option.id))}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (type === "order") {
    const optionIds = options.map(option => option.id);
    const order = Array.isArray(answer) ? answer : optionIds;
    return (
      <div className="spark-order-list">
        {order.map((optionId, index) => {
          const option = options.find(item => item.id === optionId);
          return (
            <div className="spark-order-item" key={optionId}>
              <span>{index + 1}</span>
              <strong>{option?.label || optionId}</strong>
              <button type="button" disabled={disabled || index === 0} onClick={() => onAnswer(moveOrderedValue(answer, optionIds, optionId, -1))}>
                Up
              </button>
              <button type="button" disabled={disabled || index === order.length - 1} onClick={() => onAnswer(moveOrderedValue(answer, optionIds, optionId, 1))}>
                Down
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="spark-option-list">
      {options.map(option => {
        const checked = answer === option.id;
        return (
          <label className={`spark-option ${checked ? "is-selected" : ""}`} key={option.id}>
            <input
              type="radio"
              name={question.id}
              value={option.id}
              checked={checked}
              disabled={disabled}
              onChange={() => onAnswer(option.id)}
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export function SparkApp({ state, onSubmitTest }: SparkAppProps) {
  const nextTest = getNextAcademicTest(state);
  const [mode, setMode] = useState<"tests" | "courses">("tests");
  const [selectedTestId, setSelectedTestId] = useState(nextTest?.id || ACADEMIC_TESTS[0]?.id || "");
  const [selectedCourseId, setSelectedCourseId] = useState(ACADEMIC_COURSES[0]?.id || "");
  const selectedTest = useMemo(
    () => ACADEMIC_TESTS.find(test => test.id === selectedTestId) || nextTest || ACADEMIC_TESTS[0],
    [nextTest, selectedTestId],
  );
  const [answers, setAnswers] = useState<Record<string, AcademicAnswerValue>>({});
  const [lastResult, setLastResult] = useState<AcademicTestResult | null>(null);
  const prep = selectedTest ? getPrepRecord(state, selectedTest.courseId) : null;
  const difficulty = selectedTest ? calculateAcademicDifficulty(state, selectedTest) : null;
  const completed = selectedTest ? getCompletedTest(state, selectedTest.id) : null;
  const selectedQuestions = selectedTest ? getResolvedAcademicQuestions(state, selectedTest) : [];
  const timing = selectedTest ? getTestTiming(state, selectedTest) : null;
  const canTake = Boolean(selectedTest && testIsAvailable(state, selectedTest));
  const allAnswered = Boolean(selectedTest && selectedQuestions.every(question => answerComplete(question, answers[question.id])));
  const locations = getLocationDirectory(state);

  function selectTest(testId: string) {
    setMode("tests");
    setSelectedTestId(testId);
    setAnswers({});
    setLastResult(null);
  }

  function selectCourse(courseId: string) {
    setMode("courses");
    setSelectedCourseId(courseId);
  }

  function submit() {
    if (!selectedTest || !allAnswered || !canTake) return;
    const result = onSubmitTest(selectedTest.id, answers);
    if (result) setLastResult(result);
  }

  if (!selectedTest || !prep || !difficulty || !timing) {
    return <div className="empty-state">No academic tests authored yet.</div>;
  }

  const resultToShow = lastResult || completed;
  const selectedCourse = ACADEMIC_COURSES.find(course => course.id === selectedCourseId) || ACADEMIC_COURSES[0];
  const selectedCoursePrep = selectedCourse ? getPrepRecord(state, selectedCourse.id) : null;
  const selectedCourseRecord = selectedCourse ? getCourseRecord(state, selectedCourse.id) : null;

  return (
    <div className="spark-app">
      <section className="phone-panel spark-sidebar">
        <header>
          <h2>Spark</h2>
          <strong>{mode === "tests" ? "Academic Tests" : "Courses"}</strong>
        </header>

        <div className="segmented-control spark-mode-tabs">
          <button className={mode === "tests" ? "is-active" : ""} type="button" onClick={() => setMode("tests")}>
            Tests
          </button>
          <button className={mode === "courses" ? "is-active" : ""} type="button" onClick={() => setMode("courses")}>
            Courses
          </button>
        </div>

        <div className="spark-test-list">
          {mode === "tests" ? ACADEMIC_TESTS.map(test => (
            <button
              className={`spark-test-button ${selectedTest.id === test.id ? "is-selected" : ""}`}
              type="button"
              key={test.id}
              onClick={() => selectTest(test.id)}
            >
              <span>{test.courseTitle}</span>
              <strong>{test.label}</strong>
              <small>{testStatus(state, test)}</small>
            </button>
          )) : ACADEMIC_COURSES.map(course => {
            const record = getCourseRecord(state, course.id);
            return (
              <button
                className={`spark-test-button ${selectedCourse?.id === course.id ? "is-selected" : ""}`}
                type="button"
                key={course.id}
                onClick={() => selectCourse(course.id)}
              >
                <span>{course.code}</span>
                <strong>{course.title}</strong>
                <small>standing {record.standing}/100</small>
              </button>
            );
          })}
        </div>

        {mode === "tests" ? (
          <div className="spark-prep-panel">
            <span>Prep</span>
            <strong>{difficulty.prepScore}/12</strong>
            <span>Difficulty</span>
            <strong>{difficulty.difficulty}/10</strong>
            <span>Questions</span>
            <strong>{difficulty.questionCount}/{selectedTest.questions.length}</strong>
            <span>Curve</span>
            <strong>+{difficulty.curveBonus}</strong>
            <span>Pass line</span>
            <strong>{difficulty.threshold}/{difficulty.questionCount}</strong>
          </div>
        ) : (
          <div className="spark-prep-panel">
            <span>Standing</span>
            <strong>{selectedCourseRecord?.standing ?? 70}/100</strong>
            <span>Study</span>
            <strong>{selectedCoursePrep?.studyChunks ?? 0}</strong>
            <span>Review</span>
            <strong>{selectedCoursePrep?.reviewChunks ?? 0}</strong>
            <span>Focus</span>
            <strong>{selectedCoursePrep?.focus ?? 0}</strong>
          </div>
        )}

        <p className="spark-note">
          Study history now changes hints, question count, difficulty, and curve. Late tests add pressure.
        </p>
      </section>

      {mode === "courses" && selectedCourse && selectedCoursePrep && selectedCourseRecord ? (
        <section className="phone-panel spark-test-panel spark-course-panel">
          <header className="spark-test-header">
            <div>
              <h2>{selectedCourse.code}: {selectedCourse.title}</h2>
              <p>{selectedCourse.instructor} · {locations[selectedCourse.location]?.label || selectedCourse.location}</p>
            </div>
            <span className="spark-status is-ready">{selectedCourseRecord.standing}/100</span>
          </header>

          <p className="spark-course-summary">{selectedCourse.summary}</p>
          <p className="spark-course-summary">{selectedCourse.stakes}</p>

          <div className="spark-course-grid">
            <div><span>Study</span><strong>{selectedCoursePrep.studyChunks}</strong></div>
            <div><span>Review</span><strong>{selectedCoursePrep.reviewChunks}</strong></div>
            <div><span>Focus</span><strong>{selectedCoursePrep.focus}</strong></div>
            <div><span>Sessions</span><strong>{selectedCoursePrep.history?.length || 0}</strong></div>
          </div>

          <div className="spark-question-list">
            {getCourseTests(selectedCourse.id).map(test => {
              const record = getCompletedTest(state, test.id);
              const testTiming = getTestTiming(state, test);
              return (
                <article className="spark-question" key={test.id}>
                  <header>
                    <span>{test.label}</span>
                    <small>{record ? record.grade : testTiming.pressureLabel}</small>
                  </header>
                  <p>{formatMoment(test.day, testTiming.startSlot)} · {locations[test.location]?.label || test.location}</p>
                  {record && <small className="spark-explanation">{record.outcome}: {record.consequences.join(" ")}</small>}
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="phone-panel spark-test-panel">
          <header className="spark-test-header">
            <div>
              <h2>{selectedTest.label}</h2>
              <p>{selectedTest.courseTitle} · {formatMoment(selectedTest.day, timing.startSlot)} · {locations[selectedTest.location]?.label || selectedTest.location}</p>
            </div>
            <span className={canTake ? "spark-status is-ready" : "spark-status"}>
              {completed ? "completed" : timing.pressureLabel}
            </span>
          </header>

          {timing.status === "starts_now" && !completed && (
            <div className="spark-pressure-banner">Test starts now. Taking it during the window avoids the late difficulty bump.</div>
          )}

          {resultToShow && (
            <div className="spark-result-banner">
              {resultToShow.grade} · {resultToShow.outcome} · {resultToShow.correct}/{resultToShow.total} · standing {resultToShow.courseStanding}/100
              <ul>
                {resultToShow.consequences.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}

          {!canTake && !completed && (
            <p className="subtle-copy">This test unlocks at {formatMoment(selectedTest.day, timing.startSlot)}. Current semester day: {state.day}.</p>
          )}

          <div className="spark-question-list">
            {selectedQuestions.map((question, index) => (
              <article className="spark-question" key={question.id}>
                <header>
                  <span>Question {index + 1}</span>
                  <small>{question.type || "multiple_choice"}{question.skill ? ` · ${question.skill}` : ""}</small>
                </header>
                <p>{question.prompt}</p>
                {index < difficulty.hintCount && question.hint && <em>{question.hint}</em>}
                <QuestionInput
                  question={question}
                  answer={answers[question.id]}
                  disabled={!canTake || Boolean(completed)}
                  onAnswer={value => setAnswers(current => ({ ...current, [question.id]: value }))}
                />
                {(completed || lastResult) && <small className="spark-explanation">{question.explanation}</small>}
              </article>
            ))}
          </div>

          <button className="spark-submit" type="button" onClick={submit} disabled={!canTake || !allAnswered || Boolean(completed)}>
            Submit Test
          </button>
        </section>
      )}
    </div>
  );
}
