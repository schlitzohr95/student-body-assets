import { useEffect, useMemo, useState } from "react";
import {
  requestNarratorContext,
  requestNarratorScene,
  type NarratorProviderConfig,
  type NarratorProviderType,
  type NarratorRunResult,
} from "../../narrator/client";
import { buildNarratorContext } from "../../narrator/context";
import { BENCH_SCENARIOS, makeBenchResult, type NarratorBenchResult } from "../../narrator/testBench";
import type { GameState } from "../../types/game";

const DEFAULT_ENDPOINT = "http://127.0.0.1:8787/narrate";
const DEFAULT_ACTION = "Continue this moment as a single call using only the supplied context.";

interface FreeModelOption {
  id: string;
  name: string;
  description?: string;
  contextLength?: number | null;
}

interface NarratorLabAppProps {
  state: GameState;
  onApplyResult: (result: NarratorRunResult, action: string) => void;
}

function freeModelsEndpoint(endpoint: string): string {
  try {
    const url = new URL(endpoint || DEFAULT_ENDPOINT);
    url.pathname = "/models/openrouter/free";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "http://127.0.0.1:8787/models/openrouter/free";
  }
}

export function NarratorLabApp({ state, onApplyResult }: NarratorLabAppProps) {
  const [providerType, setProviderType] = useState<NarratorProviderType>("mock");
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT);
  const [model, setModel] = useState("");
  const [freeModels, setFreeModels] = useState<FreeModelOption[]>([]);
  const [modelsFetchedAt, setModelsFetchedAt] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [hasRequestedModels, setHasRequestedModels] = useState(false);
  const [action, setAction] = useState(DEFAULT_ACTION);
  const [scenarioId, setScenarioId] = useState(BENCH_SCENARIOS[0]?.id || "");
  const [activeView, setActiveView] = useState<"result" | "bench" | "context" | "raw">("result");
  const [result, setResult] = useState<NarratorRunResult | null>(null);
  const [benchResults, setBenchResults] = useState<NarratorBenchResult[]>([]);
  const [benchRunning, setBenchRunning] = useState(false);
  const [benchError, setBenchError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const provider = useMemo<NarratorProviderConfig>(() => ({
    type: providerType,
    endpoint: endpoint.trim() || undefined,
    model: model.trim() || undefined,
  }), [endpoint, model, providerType]);

  const context = useMemo(() => buildNarratorContext(state, action), [action, state]);
  const selectedFreeModel = useMemo(() => freeModels.find(option => option.id === model), [freeModels, model]);
  const selectedScenario = useMemo(
    () => BENCH_SCENARIOS.find(scenario => scenario.id === scenarioId) || BENCH_SCENARIOS[0],
    [scenarioId],
  );
  const contextPreview = result?.context || selectedScenario?.context || context;
  const [lastRunState, setLastRunState] = useState<GameState | null>(null);
  const canApply = Boolean(result?.parsed.statePatch);
  const canRunModel = providerType !== "http" || Boolean(model.trim());

  async function refreshFreeModels() {
    setModelsLoading(true);
    setModelError(null);
    setHasRequestedModels(true);

    try {
      const response = await fetch(freeModelsEndpoint(endpoint));
      if (!response.ok) throw new Error(`Model refresh returned ${response.status}`);
      const payload = await response.json() as { fetchedAt?: string; models?: FreeModelOption[] };
      const models = Array.isArray(payload.models) ? payload.models.filter(option => option.id) : [];
      setFreeModels(models);
      setModelsFetchedAt(payload.fetchedAt || new Date().toISOString());
      if (!model && models[0]) setModel(models[0].id);
    } catch (caught) {
      setModelError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setModelsLoading(false);
    }
  }

  useEffect(() => {
    if (providerType === "http" && !hasRequestedModels) void refreshFreeModels();
  }, [hasRequestedModels, providerType]);

  async function runSingleCall() {
    if (!canRunModel) {
      setError("Select a model before running the HTTP provider.");
      return;
    }

    setRunning(true);
    setError(null);
    setLastRunState(state);

    try {
      const nextResult = await requestNarratorScene(state, action, { provider });
      setResult(nextResult);
      setActiveView("result");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setRunning(false);
    }
  }

  function loadScenario() {
    if (!selectedScenario) return;
    setAction(selectedScenario.action);
    setResult(null);
    setError(null);
    setBenchError(null);
    setActiveView("context");
  }

  async function runBenchScenario(scenario = selectedScenario) {
    if (!scenario) return;
    if (!canRunModel) {
      setBenchError("Select a model before running the HTTP provider.");
      setActiveView("bench");
      return;
    }

    setBenchRunning(true);
    setBenchError(null);
    setError(null);

    try {
      const nextRun = await requestNarratorContext({
        context: scenario.context,
        action: scenario.action,
        stateSummary: scenario.stateSummary,
      }, { provider });
      const benchResult = makeBenchResult(nextRun, scenario);
      setResult(nextRun);
      setAction(scenario.action);
      setBenchResults(current => [benchResult, ...current].slice(0, 30));
      setActiveView("bench");
    } catch (caught) {
      setBenchError(caught instanceof Error ? caught.message : String(caught));
      setActiveView("bench");
    } finally {
      setBenchRunning(false);
    }
  }

  async function runAllBenchScenarios() {
    if (!canRunModel) {
      setBenchError("Select a model before running the HTTP provider.");
      setActiveView("bench");
      return;
    }

    setBenchRunning(true);
    setBenchError(null);
    setError(null);
    setActiveView("bench");

    const nextResults: NarratorBenchResult[] = [];
    try {
      for (const scenario of BENCH_SCENARIOS) {
        const nextRun = await requestNarratorContext({
          context: scenario.context,
          action: scenario.action,
          stateSummary: scenario.stateSummary,
        }, { provider });
        nextResults.push(makeBenchResult(nextRun, scenario));
        setResult(nextRun);
      }
      if (nextResults.length) setAction(nextResults[nextResults.length - 1].action);
      setBenchResults(current => [...nextResults.reverse(), ...current].slice(0, 30));
    } catch (caught) {
      setBenchError(caught instanceof Error ? caught.message : String(caught));
      if (nextResults.length) setBenchResults(current => [...nextResults.reverse(), ...current].slice(0, 30));
    } finally {
      setBenchRunning(false);
    }
  }

  function exportRunJson() {
    if (!result) return;

    const payload = {
      exportedAt: new Date().toISOString(),
      action,
      endpoint: providerType === "http" ? endpoint : undefined,
      model,
      selectedFreeModel: selectedFreeModel || null,
      provider: result.provider,
      request: result.request,
      context: result.context,
      rawText: result.rawText,
      parsed: result.parsed,
      stateBeforeRun: lastRunState,
      stateAtExport: state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `student-body-narrator-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function exportBenchJson() {
    if (!benchResults.length) return;

    const payload = {
      exportedAt: new Date().toISOString(),
      endpoint: providerType === "http" ? endpoint : undefined,
      model,
      selectedFreeModel: selectedFreeModel || null,
      providerType,
      results: benchResults,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `student-body-bench-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  const latestBenchResult = benchResults[0];

  return (
    <div className="narrator-lab">
      <section className="phone-panel narrator-lab__controls">
        <header className="narrator-lab__header">
          <div>
            <h2>Beacon</h2>
            <strong>Narrator Lab</strong>
          </div>
          {result && <span>{result.latencyMs}ms</span>}
        </header>

        <div className="narrator-lab__control-scroll">
          <div className="segmented-control" aria-label="Narrator provider">
            {(["mock", "window", "http"] as NarratorProviderType[]).map(type => (
              <button
                className={providerType === type ? "is-active" : ""}
                type="button"
                key={type}
                onClick={() => setProviderType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          {providerType === "http" && (
            <label className="field-stack">
              <span>Endpoint</span>
              <input value={endpoint} onChange={event => setEndpoint(event.target.value)} />
            </label>
          )}

          {providerType === "http" ? (
            <>
              <div className="model-picker">
                <label className="field-stack">
                  <span>Free OpenRouter model</span>
                  <select
                    value={selectedFreeModel ? model : ""}
                    onChange={event => setModel(event.target.value)}
                    disabled={modelsLoading || !freeModels.length}
                  >
                    <option value="">{modelsLoading ? "Loading..." : "Select a free model"}</option>
                    {freeModels.map(option => (
                      <option value={option.id} key={option.id}>
                        {option.name || option.id}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="secondary-button" type="button" onClick={refreshFreeModels} disabled={modelsLoading}>
                  {modelsLoading ? "Refreshing" : "Refresh"}
                </button>
              </div>
              <label className="field-stack">
                <span>Model ID</span>
                <input placeholder="select or type model id" value={model} onChange={event => setModel(event.target.value)} />
              </label>
              {(selectedFreeModel || modelsFetchedAt || modelError) && (
                <div className={`model-status ${modelError ? "is-error" : ""}`}>
                  {modelError
                    ? modelError
                    : selectedFreeModel
                      ? `${selectedFreeModel.id}${selectedFreeModel.contextLength ? ` · ${selectedFreeModel.contextLength.toLocaleString()} ctx` : ""}`
                      : `Fetched ${freeModels.length} free models`}
                </div>
              )}
            </>
          ) : (
            <label className="field-stack">
              <span>Model</span>
              <input placeholder="optional" value={model} onChange={event => setModel(event.target.value)} />
            </label>
          )}

          <label className="field-stack">
            <span>Scenario preset</span>
            <select value={scenarioId} onChange={event => setScenarioId(event.target.value)}>
              {BENCH_SCENARIOS.map(scenario => (
                <option value={scenario.id} key={scenario.id}>{scenario.label}</option>
              ))}
            </select>
          </label>
          {selectedScenario && <p className="bench-focus">{selectedScenario.focus}</p>}
          <div className="bench-action-row">
            <button className="secondary-button" type="button" onClick={loadScenario}>
              Load
            </button>
            <button className="secondary-button" type="button" onClick={() => void runBenchScenario()} disabled={benchRunning}>
              {benchRunning ? "Running" : "Run preset"}
            </button>
            <button className="secondary-button" type="button" onClick={() => void runAllBenchScenarios()} disabled={benchRunning}>
              Run all
            </button>
          </div>

          <label className="field-stack field-stack--grow">
            <span>Action</span>
            <textarea value={action} onChange={event => setAction(event.target.value)} />
          </label>
        </div>

        <div className="narrator-lab__actions">
          <button type="button" onClick={runSingleCall} disabled={running}>
            {running ? "Running" : "Run single call"}
          </button>
          <button type="button" onClick={() => result && onApplyResult(result, action)} disabled={!canApply}>
            Apply patch
          </button>
          <button type="button" onClick={exportRunJson} disabled={!result}>
            Export JSON
          </button>
        </div>
      </section>

      <section className="phone-panel narrator-lab__output">
        <div className="narrator-tabs" role="tablist" aria-label="Narrator output">
          {(["result", "bench", "context", "raw"] as const).map(view => (
            <button
              className={activeView === view ? "is-active" : ""}
              type="button"
              key={view}
              onClick={() => setActiveView(view)}
            >
              {view}
            </button>
          ))}
        </div>

        {error && <div className="narrator-error">{error}</div>}

        {activeView === "result" && (
          <div className="narrator-result">
            {!result && !error && <p className="subtle-copy">Run the mock provider first, then swap to a live bridge.</p>}
            {result && (
              <>
                <article>
                  <h3>Narration</h3>
                  <p>{result.parsed.narration || "No narration parsed."}</p>
                </article>
                <article>
                  <h3>Choices</h3>
                  <div className="narrator-choice-list">
                    {result.parsed.choices.length
                      ? result.parsed.choices.map(choice => <span key={choice.id}>{choice.label}</span>)
                      : <span>{result.parsed.open ? "Open response allowed" : "No choices parsed"}</span>}
                  </div>
                </article>
                <article>
                  <h3>State Patch</h3>
                  <pre>{JSON.stringify(result.parsed.statePatch, null, 2) || "null"}</pre>
                </article>
              </>
            )}
          </div>
        )}

        {activeView === "bench" && (
          <div className="bench-panel">
            <header className="bench-panel__header">
              <div>
                <h3>Test Bench</h3>
                <p>{latestBenchResult ? `${latestBenchResult.score.passed}/${latestBenchResult.score.total} latest score` : "Run a preset to score model behavior."}</p>
              </div>
              <button className="secondary-button" type="button" onClick={exportBenchJson} disabled={!benchResults.length}>
                Export Bench JSON
              </button>
            </header>

            {benchError && <div className="narrator-error">{benchError}</div>}

            {!benchResults.length && !benchError && (
              <p className="subtle-copy">Presets check continuity, witness boundaries, parseable choices, and small state patches.</p>
            )}

            {benchResults.map(item => (
              <article className="bench-card" key={item.id}>
                <header>
                  <strong>{item.scenarioLabel}</strong>
                  <span className={item.score.failed ? "bench-score is-warn" : "bench-score"}>{item.score.passed}/{item.score.total}</span>
                </header>
                <p>{item.scenarioFocus}</p>
                <small>{item.model || "no model"} · {item.latencyMs}ms · {new Date(item.ranAt).toLocaleTimeString()}</small>
                <div className="bench-flag-grid">
                  {item.score.flags.map(flag => (
                    <span className={flag.passed ? "bench-flag" : "bench-flag is-fail"} title={flag.detail} key={flag.id}>
                      {flag.label}
                    </span>
                  ))}
                </div>
                <details>
                  <summary>Notes</summary>
                  <ul>
                    {item.score.flags.filter(flag => !flag.passed).map(flag => (
                      <li key={flag.id}>{flag.detail}</li>
                    ))}
                    {!item.score.failed && <li>No failed flags.</li>}
                  </ul>
                </details>
              </article>
            ))}
          </div>
        )}

        {activeView === "context" && <textarea className="narrator-text-preview" readOnly value={contextPreview} />}
        {activeView === "raw" && <textarea className="narrator-text-preview" readOnly value={result?.rawText || ""} />}
      </section>
    </div>
  );
}
