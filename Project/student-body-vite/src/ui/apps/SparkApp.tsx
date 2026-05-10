import { useMemo, useState } from "react";
import { ACADEMIC_TESTS } from "../../data/academics";
import { calculateAcademicDifficulty, getCompletedTest, getNextAcademicTest, getPrepRecord, testIsAvailable } from "../../engine/academics";
import type { AcademicTestDefinition, AcademicTestResult, GameState } from "../../types/game";
import { formatMoment } from "../format";

interface SparkAppProps {
  state: GameState;
  onSubmitTest: (testId: string, answers: Record<string, string>) => AcademicTestResult | null;
}

function testStatus(state: GameState, test: AcademicTestDefinition) {
  const completed = getCompletedTest(state, test.id);
  if (completed) return `${completed.grade} (${completed.correct}/${completed.total})`;
  if (testIsAvailable(state, test)) return "available";
  return `day ${test.day}`;
}

export function SparkApp({ state, onSubmitTest }: SparkAppProps) {
  const nextTest = getNextAcademicTest(state);
  const [selectedTestId, setSelectedTestId] = useState(nextTest?.id || ACADEMIC_TESTS[0]?.id || "");
  const selectedTest = useMemo(
    () => ACADEMIC_TESTS.find(test => test.id === selectedTestId) || nextTest || ACADEMIC_TESTS[0],
    [nextTest, selectedTestId],
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [lastResult, setLastResult] = useState<AcademicTestResult | null>(null);
  const prep = selectedTest ? getPrepRecord(state, selectedTest.courseId) : null;
  const difficulty = selectedTest ? calculateAcademicDifficulty(state, selectedTest) : null;
  const completed = selectedTest ? getCompletedTest(state, selectedTest.id) : null;
  const canTake = Boolean(selectedTest && testIsAvailable(state, selectedTest));
  const allAnswered = Boolean(selectedTest && selectedTest.questions.every(question => answers[question.id]));

  function selectTest(testId: string) {
    setSelectedTestId(testId);
    setAnswers({});
    setLastResult(null);
  }

  function submit() {
    if (!selectedTest || !allAnswered || !canTake) return;
    const result = onSubmitTest(selectedTest.id, answers);
    if (result) setLastResult(result);
  }

  if (!selectedTest || !prep || !difficulty) {
    return <div className="empty-state">No academic tests authored yet.</div>;
  }

  return (
    <div className="spark-app">
      <section className="phone-panel spark-sidebar">
        <header>
          <h2>Spark</h2>
          <strong>Academic Tests</strong>
        </header>

        <div className="spark-test-list">
          {ACADEMIC_TESTS.map(test => (
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
          ))}
        </div>

        <div className="spark-prep-panel">
          <span>Prep</span>
          <strong>{difficulty.prepScore}/10</strong>
          <span>Difficulty</span>
          <strong>{difficulty.difficulty}/10</strong>
          <span>Pass line</span>
          <strong>{difficulty.threshold}/{selectedTest.questions.length}</strong>
        </div>

        <p className="spark-note">
          Study blocks lower difficulty and unlock hints. Knowledge and Grit help keep the threshold sane.
        </p>
      </section>

      <section className="phone-panel spark-test-panel">
        <header className="spark-test-header">
          <div>
            <h2>{selectedTest.label}</h2>
            <p>{selectedTest.courseTitle} · {formatMoment(selectedTest.day, 40)} · {selectedTest.location}</p>
          </div>
          <span className={canTake ? "spark-status is-ready" : "spark-status"}>
            {completed ? "completed" : canTake ? "test day" : "upcoming"}
          </span>
        </header>

        {completed && (
          <div className="spark-result-banner">
            Completed with {completed.grade}: {completed.correct}/{completed.total}.
          </div>
        )}

        {lastResult && (
          <div className="spark-result-banner">
            Result saved: {lastResult.grade}, {lastResult.correct}/{lastResult.total}.
          </div>
        )}

        {!canTake && !completed && (
          <p className="subtle-copy">This test unlocks on semester day {selectedTest.day}. Current semester day: {state.day}.</p>
        )}

        <div className="spark-question-list">
          {selectedTest.questions.map((question, index) => (
            <article className="spark-question" key={question.id}>
              <header>
                <span>Question {index + 1}</span>
                {question.skill && <small>{question.skill}</small>}
              </header>
              <p>{question.prompt}</p>
              {difficulty.hintUnlocked && question.hint && <em>{question.hint}</em>}
              <div className="spark-option-list">
                {question.options.map(option => {
                  const checked = answers[question.id] === option.id;
                  return (
                    <label className={`spark-option ${checked ? "is-selected" : ""}`} key={option.id}>
                      <input
                        type="radio"
                        name={question.id}
                        value={option.id}
                        checked={checked}
                        disabled={!canTake || Boolean(completed)}
                        onChange={() => setAnswers(current => ({ ...current, [question.id]: option.id }))}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
              {(completed || lastResult) && <small className="spark-explanation">{question.explanation}</small>}
            </article>
          ))}
        </div>

        <button className="spark-submit" type="button" onClick={submit} disabled={!canTake || !allAnswered || Boolean(completed)}>
          Submit Test
        </button>
      </section>
    </div>
  );
}
