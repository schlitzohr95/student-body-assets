import { useEffect, useMemo, useRef, useState } from "react";
import {
  requestNarratorContext,
  requestNarratorScene,
  type NarratorProviderConfig,
  type NarratorProviderType,
  type NarratorRunResult,
} from "../../narrator/client";
import { buildNarratorContext } from "../../narrator/context";
import { BENCH_SCENARIOS, makeBenchResult, type NarratorBenchResult } from "../../narrator/testBench";
import { normalizeLocationMap, normalizeNpcMap, type WorldPackImportSummary } from "../../engine/worldPacks";
import { exportJsonFile, readJsonFile } from "../../services/jsonFiles";
import { fetchWorldPack, fetchWorldPackCatalog, type WorldPackCatalogEntry } from "../../services/worldPackCatalog";
import type { GameState, NarratorSceneMode, NarratorSettings, WorldPack } from "../../types/game";

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
  narratorSettings: NarratorSettings;
  onNarratorSettingsChange: (settings: Partial<NarratorSettings>) => void;
  onImportState: (state: GameState) => void;
  onImportWorldPack: (pack: WorldPack, sourceFileName?: string) => WorldPackImportSummary;
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

function unwrapSavePayload(payload: unknown): GameState {
  if (payload && typeof payload === "object" && "state" in payload) {
    return (payload as { state: GameState }).state;
  }
  return payload as GameState;
}

function formatPackSummary(summary: WorldPackImportSummary) {
  const parts = [
    `${summary.npcCount} NPCs`,
    `${summary.locationCount} locations`,
    summary.relationshipCount ? `${summary.relationshipCount} relationships` : "",
    summary.knownLocationCount || summary.rumoredLocationCount ? `${summary.knownLocationCount + summary.rumoredLocationCount} location intel` : "",
    summary.warningCount ? `${summary.warningCount} warnings` : "",
  ].filter(Boolean);
  return `${summary.name}: ${parts.join(", ")}.`;
}

export function NarratorLabApp({
  state,
  onApplyResult,
  narratorSettings,
  onNarratorSettingsChange,
  onImportState,
  onImportWorldPack,
}: NarratorLabAppProps) {
  const [sceneMode, setSceneMode] = useState<NarratorSceneMode>(narratorSettings.mode || "scripted");
  const [providerType, setProviderType] = useState<NarratorProviderType>(narratorSettings.providerType || "http");
  const [endpoint, setEndpoint] = useState(narratorSettings.endpoint || DEFAULT_ENDPOINT);
  const [model, setModel] = useState(narratorSettings.model || "");
  const [freeModels, setFreeModels] = useState<FreeModelOption[]>([]);
  const [modelsFetchedAt, setModelsFetchedAt] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [hasRequestedModels, setHasRequestedModels] = useState(false);
  const [action, setAction] = useState(DEFAULT_ACTION);
  const [scenarioId, setScenarioId] = useState(BENCH_SCENARIOS[0]?.id || "");
  const [activeView, setActiveView] = useState<"result" | "bench" | "context" | "raw" | "state">("result");
  const [result, setResult] = useState<NarratorRunResult | null>(null);
  const [benchResults, setBenchResults] = useState<NarratorBenchResult[]>([]);
  const [benchRunning, setBenchRunning] = useState(false);
  const [benchError, setBenchError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toolMessage, setToolMessage] = useState<string | null>(null);
  const [packCatalog, setPackCatalog] = useState<WorldPackCatalogEntry[]>([]);
  const [selectedPackId, setSelectedPackId] = useState("");
  const [packCatalogLoading, setPackCatalogLoading] = useState(false);
  const [packCatalogError, setPackCatalogError] = useState<string | null>(null);
  const [hasRequestedPackCatalog, setHasRequestedPackCatalog] = useState(false);
  const [lastPackSummary, setLastPackSummary] = useState<WorldPackImportSummary | null>(null);
  const [running, setRunning] = useState(false);
  const saveInputRef = useRef<HTMLInputElement | null>(null);
  const worldPackInputRef = useRef<HTMLInputElement | null>(null);

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
  const statePreview = useMemo(() => JSON.stringify(state, null, 2), [state]);
  const worldPackMeta = state.world?.packMeta || [];
  const latestWorldPack = worldPackMeta[worldPackMeta.length - 1];
  const importedNpcCount = Object.keys(normalizeNpcMap(state.world?.npcs)).length;
  const importedLocationCount = Object.keys(normalizeLocationMap(state.world?.locations)).length;
  const selectedBundledPack = useMemo(
    () => packCatalog.find(pack => pack.id === selectedPackId) || packCatalog[0],
    [packCatalog, selectedPackId],
  );

  useEffect(() => {
    onNarratorSettingsChange({ mode: sceneMode, providerType, endpoint, model });
  }, [endpoint, model, onNarratorSettingsChange, providerType, sceneMode]);

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

  useEffect(() => {
    if (!hasRequestedPackCatalog) void refreshPackCatalog();
  }, [hasRequestedPackCatalog]);

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
    exportJsonFile("student-body-narrator", payload);
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
    exportJsonFile("student-body-bench", payload);
  }

  function exportSaveJson() {
    exportJsonFile("student-body-save", {
      exportKind: "student-body-save",
      exportedAt: new Date().toISOString(),
      state,
    });
    setToolMessage("Save JSON exported.");
    setActiveView("state");
  }

  async function importSaveFile(file: File) {
    try {
      const payload = await readJsonFile(file);
      const importedState = unwrapSavePayload(payload);
      if (!importedState || typeof importedState !== "object") throw new Error("Save file did not contain a game state.");
      onImportState(importedState);
      setGeneratedToolMessage(`Imported save from ${file.name}.`);
    } catch (caught) {
      setGeneratedToolMessage(caught instanceof Error ? caught.message : String(caught));
    }
  }

  async function importWorldPackFile(file: File) {
    try {
      const pack = await readJsonFile<WorldPack>(file);
      if (!pack || typeof pack !== "object") throw new Error("World pack file did not contain an object.");
      const summary = onImportWorldPack(pack, file.name);
      setLastPackSummary(summary);
      setGeneratedToolMessage(`Imported ${formatPackSummary(summary)}`);
    } catch (caught) {
      setGeneratedToolMessage(caught instanceof Error ? caught.message : String(caught));
    }
  }

  async function refreshPackCatalog() {
    setPackCatalogLoading(true);
    setPackCatalogError(null);
    setHasRequestedPackCatalog(true);

    try {
      const packs = await fetchWorldPackCatalog();
      setPackCatalog(packs);
      if (!selectedPackId && packs[0]) setSelectedPackId(packs[0].id);
    } catch (caught) {
      setPackCatalogError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setPackCatalogLoading(false);
    }
  }

  async function loadBundledWorldPack() {
    if (!selectedBundledPack) {
      setGeneratedToolMessage("No bundled world pack is selected.");
      return;
    }

    setPackCatalogLoading(true);
    setPackCatalogError(null);

    try {
      const pack = await fetchWorldPack(selectedBundledPack);
      const summary = onImportWorldPack(pack, selectedBundledPack.path);
      setLastPackSummary(summary);
      setGeneratedToolMessage(`Loaded ${formatPackSummary(summary)}`);
    } catch (caught) {
      setPackCatalogError(caught instanceof Error ? caught.message : String(caught));
      setGeneratedToolMessage(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setPackCatalogLoading(false);
    }
  }

  function setGeneratedToolMessage(message: string) {
    setToolMessage(message);
    setError(null);
    setBenchError(null);
    setActiveView("state");
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
            <span>Generated scene mode</span>
            <select value={sceneMode} onChange={event => setSceneMode(event.target.value as NarratorSceneMode)}>
              <option value="scripted">Scripted scenes only</option>
              <option value="generated">Generated next scene</option>
              <option value="generated_fallback">Generated with scripted fallback</option>
            </select>
          </label>

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
          {(["result", "bench", "context", "raw", "state"] as const).map(view => (
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
        {activeView === "state" && (
          <div className="state-tools-panel">
            <input
              ref={saveInputRef}
              className="visually-hidden-file"
              type="file"
              accept=".json,application/json"
              hidden
              aria-hidden="true"
              onChange={event => {
                const file = event.currentTarget.files?.[0];
                if (file) void importSaveFile(file);
                event.currentTarget.value = "";
              }}
            />
            <input
              ref={worldPackInputRef}
              className="visually-hidden-file"
              type="file"
              accept=".json,application/json"
              hidden
              aria-hidden="true"
              onChange={event => {
                const file = event.currentTarget.files?.[0];
                if (file) void importWorldPackFile(file);
                event.currentTarget.value = "";
              }}
            />

            <section className="state-tool-section">
              <header>
                <h3>Save Tools</h3>
                <span>Day {state.day}</span>
              </header>
              <div className="state-tool-actions">
                <button className="secondary-button" type="button" onClick={exportSaveJson}>
                  Export Save JSON
                </button>
                <button className="secondary-button" type="button" onClick={() => saveInputRef.current?.click()}>
                  Import Save JSON
                </button>
                <button className="secondary-button" type="button" onClick={() => worldPackInputRef.current?.click()}>
                  Import World Pack
                </button>
              </div>
              {toolMessage && <div className="state-tool-message">{toolMessage}</div>}
            </section>

            <section className="state-tool-section">
              <header>
                <h3>World Pack</h3>
                <span>{worldPackMeta.length} imported</span>
              </header>
              <div className="bundled-pack-picker">
                <label className="field-stack">
                  <span>Bundled world pack</span>
                  <select
                    value={selectedBundledPack?.id || ""}
                    onChange={event => setSelectedPackId(event.target.value)}
                    disabled={packCatalogLoading || !packCatalog.length}
                  >
                    <option value="">{packCatalogLoading ? "Loading..." : "Select a pack"}</option>
                    {packCatalog.map(pack => (
                      <option value={pack.id} key={pack.id}>{pack.name}</option>
                    ))}
                  </select>
                </label>
                <button className="secondary-button" type="button" onClick={refreshPackCatalog} disabled={packCatalogLoading}>
                  Refresh
                </button>
                <button className="secondary-button" type="button" onClick={loadBundledWorldPack} disabled={packCatalogLoading || !selectedBundledPack}>
                  Load Pack
                </button>
              </div>
              {selectedBundledPack?.description && <p className="pack-description">{selectedBundledPack.description}</p>}
              {packCatalogError && <div className="narrator-error">{packCatalogError}</div>}
              <dl className="world-pack-summary">
                <div>
                  <dt>Latest</dt>
                  <dd>{latestWorldPack?.name || "none"}</dd>
                </div>
                <div>
                  <dt>NPCs</dt>
                  <dd>{importedNpcCount}</dd>
                </div>
                <div>
                  <dt>Locations</dt>
                  <dd>{importedLocationCount}</dd>
                </div>
                {lastPackSummary && (
                  <>
                    <div>
                      <dt>Relationships</dt>
                      <dd>{lastPackSummary.relationshipCount}</dd>
                    </div>
                    <div>
                      <dt>Location Intel</dt>
                      <dd>{lastPackSummary.knownLocationCount} known / {lastPackSummary.rumoredLocationCount} rumored</dd>
                    </div>
                    <div>
                      <dt>Warnings</dt>
                      <dd>{lastPackSummary.warningCount}</dd>
                    </div>
                  </>
                )}
              </dl>
              {lastPackSummary?.issues.length ? (
                <details className="world-pack-issues">
                  <summary>Validation notes</summary>
                  <ul>
                    {lastPackSummary.issues.map(issue => (
                      <li key={`${issue.severity}-${issue.path}-${issue.message}`}>
                        <strong>{issue.severity}</strong> {issue.path}: {issue.message}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </section>

            <label className="field-stack state-inspector">
              <span>Debug state inspector</span>
              <textarea readOnly value={statePreview} />
            </label>
          </div>
        )}
      </section>
    </div>
  );
}
