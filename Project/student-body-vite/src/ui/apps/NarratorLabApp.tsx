import { useMemo, useState } from "react";
import {
  requestNarratorScene,
  type NarratorProviderConfig,
  type NarratorProviderType,
  type NarratorRunResult,
} from "../../narrator/client";
import { buildNarratorContext } from "../../narrator/context";
import type { GameState } from "../../types/game";

const DEFAULT_ENDPOINT = "http://127.0.0.1:8787/narrate";
const DEFAULT_ACTION = "Continue this moment as a single call using only the supplied context.";

interface NarratorLabAppProps {
  state: GameState;
  onApplyResult: (result: NarratorRunResult, action: string) => void;
}

export function NarratorLabApp({ state, onApplyResult }: NarratorLabAppProps) {
  const [providerType, setProviderType] = useState<NarratorProviderType>("mock");
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT);
  const [model, setModel] = useState("");
  const [action, setAction] = useState(DEFAULT_ACTION);
  const [activeView, setActiveView] = useState<"result" | "context" | "raw">("result");
  const [result, setResult] = useState<NarratorRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const provider = useMemo<NarratorProviderConfig>(() => ({
    type: providerType,
    endpoint: endpoint.trim() || undefined,
    model: model.trim() || undefined,
  }), [endpoint, model, providerType]);

  const context = useMemo(() => buildNarratorContext(state, action), [action, state]);
  const canApply = Boolean(result?.parsed.statePatch);

  async function runSingleCall() {
    setRunning(true);
    setError(null);

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

        <label className="field-stack">
          <span>Model</span>
          <input placeholder="optional" value={model} onChange={event => setModel(event.target.value)} />
        </label>

        <label className="field-stack field-stack--grow">
          <span>Action</span>
          <textarea value={action} onChange={event => setAction(event.target.value)} />
        </label>

        <div className="narrator-lab__actions">
          <button type="button" onClick={runSingleCall} disabled={running}>
            {running ? "Running" : "Run single call"}
          </button>
          <button type="button" onClick={() => result && onApplyResult(result, action)} disabled={!canApply}>
            Apply patch
          </button>
        </div>
      </section>

      <section className="phone-panel narrator-lab__output">
        <div className="narrator-tabs" role="tablist" aria-label="Narrator output">
          {(["result", "context", "raw"] as const).map(view => (
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

        {activeView === "context" && <textarea className="narrator-text-preview" readOnly value={context} />}
        {activeView === "raw" && <textarea className="narrator-text-preview" readOnly value={result?.rawText || ""} />}
      </section>
    </div>
  );
}
