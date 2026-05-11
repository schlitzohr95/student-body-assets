import { useEffect, useMemo, useRef, useState } from "react";
import {
  requestNarratorContext,
  requestNarratorScene,
  type NarratorProviderConfig,
  type NarratorProviderType,
  type NarratorRunResult,
} from "../../narrator/client";
import { ACADEMIC_COURSES, ACADEMIC_TESTS } from "../../data/academics";
import { formatTimeOfDay, LOCATIONS } from "../../data/locations";
import { STARTER_NPCS } from "../../data/npcs";
import { makeFreshState } from "../../engine/state";
import { buildNarratorContext } from "../../narrator/context";
import { BENCH_SCENARIOS, makeBenchResult, type NarratorBenchResult } from "../../narrator/testBench";
import { buildWorldPackFromState, normalizeLocationMap, normalizeNpcMap, summarizeWorldPack, worldPackErrorMessage, type WorldPackImportSummary } from "../../engine/worldPacks";
import { exportJsonFile, readJsonFile } from "../../services/jsonFiles";
import {
  SAVE_SLOT_IDS,
  clearSaveSlot,
  createStateBackup,
  listSaveSlots,
  listStateBackups,
  loadStateBackup,
  loadStateFromSlot,
  saveStateToSlot,
  type SaveSlotId,
  type SaveSlotMeta,
} from "../../services/storage";
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
  onImportState: (state: GameState, notificationBody?: string) => void;
  onImportWorldPack: (pack: WorldPack, sourceFileName?: string) => WorldPackImportSummary;
}

type StateInspectorFilter = "full" | "player" | "relationships" | "world" | "cast" | "academics" | "calendar" | "phone" | "logs";

const STATE_INSPECTOR_FILTERS: Array<{ id: StateInspectorFilter; label: string }> = [
  { id: "full", label: "Full state" },
  { id: "player", label: "Player" },
  { id: "relationships", label: "Relationships" },
  { id: "world", label: "World pack" },
  { id: "cast", label: "Cast" },
  { id: "academics", label: "Academics" },
  { id: "calendar", label: "Calendar" },
  { id: "phone", label: "Phone data" },
  { id: "logs", label: "Event log" },
];

const BUILT_IN_LOCATION_IDS = new Set(Object.keys(LOCATIONS));
const BUILT_IN_NPC_IDS = new Set(Object.keys(STARTER_NPCS));
const BUILT_IN_COURSE_IDS = new Set(ACADEMIC_COURSES.map(course => course.id));
const BUILT_IN_TEST_IDS = new Set(ACADEMIC_TESTS.map(test => test.id));

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

function unwrapWorldPackPayload(payload: unknown): WorldPack {
  if (payload && typeof payload === "object" && "pack" in payload) {
    return (payload as { pack: WorldPack }).pack;
  }
  return payload as WorldPack;
}

function formatSaveMeta(meta: SaveSlotMeta | undefined) {
  if (!meta || meta.isEmpty) return "Empty slot";
  const parts = [
    typeof meta.day === "number" ? `Day ${meta.day}` : "",
    typeof meta.timeSlot === "number" ? formatTimeOfDay(meta.timeSlot) : "",
    meta.location ? LOCATIONS[meta.location]?.label || meta.location : "",
  ].filter(Boolean);
  const savedAt = meta.savedAt ? new Date(meta.savedAt).toLocaleString() : "";
  return `${parts.join(" · ")}${savedAt ? ` · ${savedAt}` : ""}`;
}

function filterRecord<T>(record: Record<string, T> | undefined, keepIds: Set<string>): Record<string, T> {
  return Object.fromEntries(Object.entries(record || {}).filter(([id]) => keepIds.has(id)));
}

function removeWorldPackFlags(flags: GameState["flags"]) {
  return Object.fromEntries(Object.entries(flags || {}).filter(([key]) => !key.startsWith("world_pack_")));
}

function inspectStateSlice(state: GameState, filter: StateInspectorFilter) {
  if (filter === "player") return state.player;
  if (filter === "relationships") return state.player.relationships || {};
  if (filter === "world") return state.world || {};
  if (filter === "cast") {
    return {
      knownNpcIds: state.npcsKnown,
      npcDirectory: state.npcDirectory || {},
      starterNpcs: STARTER_NPCS,
      presentNpcIds: state.presentNpcIds || state.scene?.presentNpcIds || state.currentScene?.presentNpcIds || [],
    };
  }
  if (filter === "academics") return state.academics || {};
  if (filter === "calendar") {
    return {
      calendar: state.calendar || {},
      wake: state.wake || {},
      day: state.day,
      timeSlot: state.timeSlot,
    };
  }
  if (filter === "phone") {
    return {
      messages: state.messages,
      notes: state.notes,
      narrator: state.narrator,
    };
  }
  if (filter === "logs") return state.eventLog;
  return state;
}

function formatPackSummary(summary: WorldPackImportSummary) {
  const parts = [
    `${summary.npcCount} NPCs`,
    `${summary.locationCount} locations`,
    summary.relationshipCount ? `${summary.relationshipCount} relationships` : "",
    summary.courseCount ? `${summary.courseCount} courses` : "",
    summary.testCount ? `${summary.testCount} tests` : "",
    summary.bulletinCount ? `${summary.bulletinCount} bulletins` : "",
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
  const [pendingWorldPack, setPendingWorldPack] = useState<{ pack: WorldPack; sourceFileName: string; summary: WorldPackImportSummary } | null>(null);
  const [saveSlots, setSaveSlots] = useState<SaveSlotMeta[]>([]);
  const [backupSlots, setBackupSlots] = useState<SaveSlotMeta[]>([]);
  const [selectedSaveSlot, setSelectedSaveSlot] = useState<SaveSlotId>(SAVE_SLOT_IDS[0]);
  const [selectedBackupId, setSelectedBackupId] = useState("");
  const [stateInspectorFilter, setStateInspectorFilter] = useState<StateInspectorFilter>("full");
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
  const statePreview = useMemo(() => JSON.stringify(inspectStateSlice(state, stateInspectorFilter), null, 2), [state, stateInspectorFilter]);
  const worldPackMeta = state.world?.packMeta || [];
  const latestWorldPack = worldPackMeta[worldPackMeta.length - 1];
  const importedNpcCount = Object.keys(normalizeNpcMap(state.world?.npcs)).length;
  const importedLocationCount = Object.keys(normalizeLocationMap(state.world?.locations)).length;
  const selectedSlotMeta = saveSlots.find(slot => slot.id === selectedSaveSlot);
  const selectedBackupMeta = backupSlots.find(slot => slot.id === selectedBackupId);
  const selectedBundledPack = useMemo(
    () => packCatalog.find(pack => pack.id === selectedPackId) || packCatalog[0],
    [packCatalog, selectedPackId],
  );

  useEffect(() => {
    onNarratorSettingsChange({ mode: sceneMode, providerType, endpoint, model });
  }, [endpoint, model, onNarratorSettingsChange, providerType, sceneMode]);

  async function refreshStorageTools() {
    const [slots, backups] = await Promise.all([listSaveSlots(), listStateBackups()]);
    setSaveSlots(slots);
    setBackupSlots(backups);
    if (!selectedBackupId && backups[0]) setSelectedBackupId(backups[0].id);
    if (selectedBackupId && !backups.some(backup => backup.id === selectedBackupId)) {
      setSelectedBackupId(backups[0]?.id || "");
    }
  }

  useEffect(() => {
    void refreshStorageTools();
  }, []);

  async function backupCurrentState(reason: string) {
    const backup = await createStateBackup(state, reason);
    await refreshStorageTools();
    setSelectedBackupId(backup.id);
    return backup;
  }

  async function replaceStateWithBackup(nextState: GameState, backupReason: string, successMessage: string) {
    await backupCurrentState(backupReason);
    onImportState(nextState, successMessage);
    setGeneratedToolMessage(`${successMessage} Backup created first.`);
  }

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

  function exportCurrentWorldPack() {
    exportJsonFile("student-body-world-cast", {
      exportKind: "student-body-world-cast",
      exportedAt: new Date().toISOString(),
      pack: buildWorldPackFromState(state),
    });
    setToolMessage("World/cast JSON exported.");
    setActiveView("state");
  }

  async function saveSelectedSlot() {
    try {
      const meta = await saveStateToSlot(selectedSaveSlot, state);
      await refreshStorageTools();
      setGeneratedToolMessage(`${meta.label} saved. ${formatSaveMeta(meta)}`);
    } catch (caught) {
      setGeneratedToolMessage(caught instanceof Error ? caught.message : String(caught));
    }
  }

  async function loadSelectedSlot() {
    try {
      const importedState = await loadStateFromSlot(selectedSaveSlot);
      if (!importedState) {
        setGeneratedToolMessage(`${selectedSlotMeta?.label || "Selected slot"} is empty.`);
        return;
      }
      await backupCurrentState(`Before loading ${selectedSlotMeta?.label || selectedSaveSlot}`);
      onImportState(importedState, `${selectedSlotMeta?.label || "Save slot"} loaded.`);
      setGeneratedToolMessage(`${selectedSlotMeta?.label || "Save slot"} loaded. Backup created first.`);
    } catch (caught) {
      setGeneratedToolMessage(caught instanceof Error ? caught.message : String(caught));
    }
  }

  async function clearSelectedSlot() {
    try {
      await clearSaveSlot(selectedSaveSlot);
      await refreshStorageTools();
      setGeneratedToolMessage(`${selectedSlotMeta?.label || "Selected slot"} cleared.`);
    } catch (caught) {
      setGeneratedToolMessage(caught instanceof Error ? caught.message : String(caught));
    }
  }

  async function restoreSelectedBackup() {
    if (!selectedBackupId) {
      setGeneratedToolMessage("No backup selected.");
      return;
    }

    try {
      const importedState = await loadStateBackup(selectedBackupId);
      if (!importedState) {
        setGeneratedToolMessage("Selected backup could not be loaded.");
        await refreshStorageTools();
        return;
      }
      await backupCurrentState("Before restoring backup");
      onImportState(importedState, "Backup restored.");
      setGeneratedToolMessage(`Restored backup. ${selectedBackupMeta ? formatSaveMeta(selectedBackupMeta) : "Current state was backed up first."}`);
    } catch (caught) {
      setGeneratedToolMessage(caught instanceof Error ? caught.message : String(caught));
    }
  }

  async function resetAcademicsSection() {
    const fresh = makeFreshState();
    const academicTraits = new Set(["academic-momentum", "needs-review"]);
    await replaceStateWithBackup({
      ...state,
      player: {
        ...state.player,
        traits: (state.player.traits || []).filter(trait => !academicTraits.has(trait)),
      },
      academics: fresh.academics,
      calendar: fresh.calendar,
    }, "Before resetting academics", "Academics reset.");
  }

  async function resetRelationshipsSection() {
    await replaceStateWithBackup({
      ...state,
      player: {
        ...state.player,
        relationships: {},
      },
      chemistry: {},
    }, "Before resetting relationships", "Relationships reset.");
  }

  async function resetWorldPackSection() {
    const nextLocation = BUILT_IN_LOCATION_IDS.has(state.location) ? state.location : "dorm_room";
    const nextKnownNpcs = [...new Set(["roommate", ...(state.npcsKnown || []).filter(npcId => BUILT_IN_NPC_IDS.has(npcId))])];
    setPendingWorldPack(null);
    setLastPackSummary(null);
    await replaceStateWithBackup({
      ...state,
      location: nextLocation,
      world: undefined,
      npcDirectory: undefined,
      npcMoods: filterRecord(state.npcMoods, BUILT_IN_NPC_IDS),
      presentNpcIds: undefined,
      presentNpcs: undefined,
      scene: undefined,
      currentScene: undefined,
      npcsKnown: nextKnownNpcs,
      locationKnowledge: filterRecord(state.locationKnowledge, BUILT_IN_LOCATION_IDS),
      eventLog: state.eventLog.filter(event => !(event.text || event.summary || "").startsWith("Imported world pack")),
      flags: removeWorldPackFlags(state.flags),
      player: {
        ...state.player,
        relationships: filterRecord(state.player.relationships, BUILT_IN_NPC_IDS),
      },
      academics: {
        prep: filterRecord(state.academics?.prep, BUILT_IN_COURSE_IDS),
        completedTests: filterRecord(state.academics?.completedTests, BUILT_IN_TEST_IDS),
        courses: filterRecord(state.academics?.courses, BUILT_IN_COURSE_IDS),
      },
    }, "Before resetting world pack", "World pack data reset.");
  }

  function stageWorldPackPreview(pack: WorldPack, sourceFileName: string) {
    const summary = summarizeWorldPack(pack, sourceFileName);
    setPendingWorldPack({ pack, sourceFileName, summary });
    setLastPackSummary(summary);
    setGeneratedToolMessage(summary.errorCount
      ? `Preview blocked. ${worldPackErrorMessage(summary)}`
      : `Preview ready. ${formatPackSummary(summary)}`);
  }

  async function importPendingWorldPack() {
    if (!pendingWorldPack) {
      setGeneratedToolMessage("Preview a world pack before importing.");
      return;
    }
    if (pendingWorldPack.summary.errorCount) {
      setGeneratedToolMessage(worldPackErrorMessage(pendingWorldPack.summary));
      return;
    }

    try {
      await backupCurrentState(`Before importing world/cast pack ${pendingWorldPack.sourceFileName}`);
      const summary = onImportWorldPack(pendingWorldPack.pack, pendingWorldPack.sourceFileName);
      setLastPackSummary(summary);
      setPendingWorldPack(null);
      setGeneratedToolMessage(`Imported ${formatPackSummary(summary)} Backup created first.`);
    } catch (caught) {
      setGeneratedToolMessage(caught instanceof Error ? caught.message : String(caught));
    }
  }

  async function importSaveFile(file: File) {
    try {
      const payload = await readJsonFile(file);
      const importedState = unwrapSavePayload(payload);
      if (!importedState || typeof importedState !== "object") throw new Error("Save file did not contain a game state.");
      await backupCurrentState(`Before importing save ${file.name}`);
      onImportState(importedState, `Imported save from ${file.name}.`);
      setGeneratedToolMessage(`Imported save from ${file.name}. Backup created first.`);
    } catch (caught) {
      setGeneratedToolMessage(caught instanceof Error ? caught.message : String(caught));
    }
  }

  async function importWorldPackFile(file: File) {
    try {
      const pack = unwrapWorldPackPayload(await readJsonFile(file));
      if (!pack || typeof pack !== "object") throw new Error("World pack file did not contain an object.");
      stageWorldPackPreview(pack, file.name);
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

  async function previewBundledWorldPack() {
    if (!selectedBundledPack) {
      setGeneratedToolMessage("No bundled world pack is selected.");
      return;
    }

    setPackCatalogLoading(true);
    setPackCatalogError(null);

    try {
      const pack = await fetchWorldPack(selectedBundledPack);
      stageWorldPackPreview(pack, selectedBundledPack.path);
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
              <div className="save-slot-row">
                <label className="field-stack">
                  <span>Manual save slot</span>
                  <select value={selectedSaveSlot} onChange={event => setSelectedSaveSlot(event.target.value as SaveSlotId)}>
                    {SAVE_SLOT_IDS.map(slotId => {
                      const meta = saveSlots.find(slot => slot.id === slotId);
                      return <option value={slotId} key={slotId}>{meta?.label || slotId}</option>;
                    })}
                  </select>
                </label>
                <div className="save-slot-actions">
                  <button className="secondary-button" type="button" onClick={() => void saveSelectedSlot()}>
                    Save Current
                  </button>
                  <button className="secondary-button" type="button" onClick={() => void loadSelectedSlot()} disabled={selectedSlotMeta?.isEmpty !== false}>
                    Load
                  </button>
                  <button className="secondary-button" type="button" onClick={() => void clearSelectedSlot()} disabled={selectedSlotMeta?.isEmpty !== false}>
                    Clear
                  </button>
                </div>
              </div>
              <p className="save-slot-meta">{formatSaveMeta(selectedSlotMeta)}</p>
              <div className="state-tool-actions">
                <button className="secondary-button" type="button" onClick={exportSaveJson}>
                  Export Save JSON
                </button>
                <button className="secondary-button" type="button" onClick={() => saveInputRef.current?.click()}>
                  Import Save JSON
                </button>
                <button className="secondary-button" type="button" onClick={exportCurrentWorldPack}>
                  Export World/Cast
                </button>
                <button className="secondary-button" type="button" onClick={() => worldPackInputRef.current?.click()}>
                  Preview World/Cast
                </button>
              </div>
              <div className="backup-restore-row">
                <label className="field-stack">
                  <span>Import/reset backups</span>
                  <select value={selectedBackupId} onChange={event => setSelectedBackupId(event.target.value)} disabled={!backupSlots.length}>
                    <option value="">{backupSlots.length ? "Select a backup" : "No backups yet"}</option>
                    {backupSlots.map(backup => (
                      <option value={backup.id} key={backup.id}>{backup.reason || backup.label}</option>
                    ))}
                  </select>
                </label>
                <button className="secondary-button" type="button" onClick={() => void restoreSelectedBackup()} disabled={!selectedBackupId}>
                  Restore Backup
                </button>
              </div>
              {selectedBackupMeta && <p className="save-slot-meta">{formatSaveMeta(selectedBackupMeta)}</p>}
              {toolMessage && <div className="state-tool-message">{toolMessage}</div>}
            </section>

            <section className="state-tool-section">
              <header>
                <h3>World/Cast Pack</h3>
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
                <button className="secondary-button" type="button" onClick={previewBundledWorldPack} disabled={packCatalogLoading || !selectedBundledPack}>
                  Preview
                </button>
                <button className="secondary-button" type="button" onClick={() => void importPendingWorldPack()} disabled={!pendingWorldPack || pendingWorldPack.summary.errorCount > 0}>
                  Import Preview
                </button>
              </div>
              {selectedBundledPack?.description && <p className="pack-description">{selectedBundledPack.description}</p>}
              {pendingWorldPack && (
                <div className={pendingWorldPack.summary.errorCount ? "pack-preview is-error" : "pack-preview"}>
                  <strong>{pendingWorldPack.summary.name}</strong>
                  <span>{formatPackSummary(pendingWorldPack.summary)}</span>
                </div>
              )}
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
                    <div>
                      <dt>Courses</dt>
                      <dd>{lastPackSummary.courseCount}</dd>
                    </div>
                    <div>
                      <dt>Tests</dt>
                      <dd>{lastPackSummary.testCount}</dd>
                    </div>
                    <div>
                      <dt>Bulletins</dt>
                      <dd>{lastPackSummary.bulletinCount}</dd>
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

            <section className="state-tool-section">
              <header>
                <h3>Reset Sections</h3>
                <span>backs up first</span>
              </header>
              <div className="reset-action-row">
                <button className="secondary-button" type="button" onClick={() => void resetAcademicsSection()}>
                  Reset Academics
                </button>
                <button className="secondary-button" type="button" onClick={() => void resetRelationshipsSection()}>
                  Reset Relationships
                </button>
                <button className="secondary-button" type="button" onClick={() => void resetWorldPackSection()}>
                  Reset World Pack
                </button>
              </div>
            </section>

            <label className="field-stack state-inspector">
              <span>Debug state inspector</span>
              <select value={stateInspectorFilter} onChange={event => setStateInspectorFilter(event.target.value as StateInspectorFilter)}>
                {STATE_INSPECTOR_FILTERS.map(filter => (
                  <option value={filter.id} key={filter.id}>{filter.label}</option>
                ))}
              </select>
              <textarea readOnly value={statePreview} />
            </label>
          </div>
        )}
      </section>
    </div>
  );
}
