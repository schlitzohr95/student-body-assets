import { useCallback, useEffect, useRef, useState } from "react";
import { APP_BY_ID } from "./data/apps";
import { getScriptedScene } from "./engine/scriptedScenes";
import { makeFreshState, normalizeState } from "./engine/state";
import { addMarginNote, applyChoice, navigateToLocation, sendPulseMessage } from "./engine/transitions";
import { applyWorldPack } from "./engine/worldPacks";
import { applyNarratorStatePatch } from "./narrator/patch";
import { requestNarratorScene, type NarratorProviderConfig, type NarratorRunResult } from "./narrator/client";
import { validateGeneratedScene } from "./narrator/validation";
import { clearState, loadState, saveState } from "./services/storage";
import type { Choice, GameState, LocationId, NarratorSettings, Scene, WorldPack } from "./types/game";
import { CompassApp } from "./ui/apps/CompassApp";
import { AnthropApp } from "./ui/apps/AnthropApp";
import { BuzzApp } from "./ui/apps/BuzzApp";
import { MarginApp } from "./ui/apps/MarginApp";
import { NarratorLabApp } from "./ui/apps/NarratorLabApp";
import { PulseApp } from "./ui/apps/PulseApp";
import { RosterApp } from "./ui/apps/RosterApp";
import { SelfApp } from "./ui/apps/SelfApp";
import { StubApp } from "./ui/apps/StubApp";
import { DialogueStrip } from "./ui/components/DialogueStrip";
import { FloatingControls } from "./ui/components/FloatingControls";
import { HeaderBar } from "./ui/components/HeaderBar";
import { NotificationBanner } from "./ui/components/NotificationBanner";
import { PhoneFrame } from "./ui/components/PhoneFrame";
import { PhoneHomeScreen } from "./ui/components/PhoneHomeScreen";
import { SceneImage } from "./ui/components/SceneImage";

type PhoneState = {
  open: boolean;
  view: "home" | `app:${string}`;
  orientation: "portrait" | "landscape";
};

type Notification = {
  app: string;
  body: string;
};

const DEFAULT_NARRATOR_SETTINGS: NarratorSettings = {
  mode: "scripted",
  providerType: "http",
  endpoint: "http://127.0.0.1:8787/narrate",
  model: "",
};

export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [phone, setPhone] = useState<PhoneState>({ open: false, view: "home", orientation: "portrait" });
  const [notification, setNotification] = useState<Notification | null>(null);
  const [generatedScene, setGeneratedScene] = useState<Scene | null>(null);
  const [generatingScene, setGeneratingScene] = useState(false);
  const notificationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let live = true;
    loadState().then(saved => {
      if (!live) return;
      setState(saved ? normalizeState(saved) : makeFreshState());
      setLoaded(true);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (loaded && state) void saveState(state);
  }, [loaded, state]);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) window.clearTimeout(notificationTimerRef.current);
    };
  }, []);

  const showNotification = useCallback((next: Notification) => {
    setNotification(next);
    if (notificationTimerRef.current) window.clearTimeout(notificationTimerRef.current);
    notificationTimerRef.current = window.setTimeout(() => setNotification(null), 5500);
  }, []);

  const togglePhone = useCallback(() => {
    setPhone(current => ({
      ...current,
      open: !current.open,
      view: !current.open ? "home" : current.view,
      orientation: !current.open ? "portrait" : current.orientation,
    }));
  }, []);

  const openApp = useCallback((appId: string) => {
    const app = APP_BY_ID[appId];
    if (!app) return;
    setPhone({ open: true, view: `app:${appId}`, orientation: app.layout });
  }, []);

  const openPhoneHome = useCallback(() => {
    setPhone({ open: true, view: "home", orientation: "portrait" });
  }, []);

  const handleNewGame = useCallback(async () => {
    if (!window.confirm("Start a new game? Current progress will be lost.")) return;
    await clearState();
    setState(makeFreshState());
    setGeneratedScene(null);
    setPhone({ open: false, view: "home", orientation: "portrait" });
    setNotification(null);
  }, []);

  const handleNavigate = useCallback((location: LocationId) => {
    setState(current => {
      if (!current) return current;
      return navigateToLocation(current, location).state;
    });
    setGeneratedScene(null);
    setPhone({ open: false, view: "home", orientation: "portrait" });
  }, []);

  const handleChoice = useCallback(async (choice: Choice) => {
    if (!state || generatingScene) return;
    const settings = { ...DEFAULT_NARRATOR_SETTINGS, ...(state.narrator || {}) };
    const update = applyChoice(state, choice);
    const shouldGenerate = settings.mode !== "scripted";

    if (!shouldGenerate) {
      setGeneratedScene(null);
      setState(update.state);
      if (update.notification) window.setTimeout(() => showNotification(update.notification!), 600);
      return;
    }

    const provider: NarratorProviderConfig = {
      type: settings.providerType,
      endpoint: settings.endpoint || DEFAULT_NARRATOR_SETTINGS.endpoint,
      model: settings.model || undefined,
    };

    if (provider.type === "http" && !provider.model) {
      setGeneratedScene(null);
      setState(update.state);
      showNotification({ app: "Beacon", body: "Select a narrator model before enabling generated scenes." });
      return;
    }

    setGeneratingScene(true);
    try {
      const result = await requestNarratorScene(state, choice, { provider });
      const validation = validateGeneratedScene(result);

      if (!validation.ok) {
        setGeneratedScene(null);
        setState(update.state);
        showNotification({ app: "Beacon", body: `Generated scene rejected: ${validation.summary}.` });
        return;
      }

      const patchedState = applyNarratorStatePatch(update.state, result.parsed.statePatch);
      const fallbackChoices = getScriptedScene(patchedState).choices;
      setGeneratedScene({
        narration: result.parsed.narration,
        choices: result.parsed.choices.length ? result.parsed.choices : fallbackChoices,
      });
      setState(patchedState);
      if (update.notification) window.setTimeout(() => showNotification(update.notification!), 600);
    } catch (caught) {
      setGeneratedScene(null);
      setState(update.state);
      showNotification({
        app: "Beacon",
        body: caught instanceof Error ? `Generated scene failed: ${caught.message}` : "Generated scene failed; scripted scene used.",
      });
    } finally {
      setGeneratingScene(false);
    }
  }, [generatingScene, showNotification, state]);

  const handleSendMessage = useCallback((npcId: string, templateId: "check_in" | "ask_about_day" | "invite_coffee") => {
    if (!state) return;
    const update = sendPulseMessage(state, npcId, templateId);
    setState(update.state);
    if (update.notification) showNotification(update.notification);
  }, [showNotification, state]);

  const handleAddNote = useCallback((text: string) => {
    if (!state) return;
    setState(addMarginNote(state, text).state);
  }, [state]);

  const handleApplyNarratorResult = useCallback((result: NarratorRunResult) => {
    setState(current => current ? applyNarratorStatePatch(current, result.parsed.statePatch) : current);
    showNotification({
      app: "Beacon",
      body: result.parsed.statePatch ? "Narrator state patch applied." : "No state patch was available.",
    });
  }, [showNotification]);

  const handleNarratorSettingsChange = useCallback((settings: Partial<NarratorSettings>) => {
    if (settings.mode === "scripted") setGeneratedScene(null);
    setState(current => current
      ? {
          ...current,
          narrator: {
            ...DEFAULT_NARRATOR_SETTINGS,
            ...(current.narrator || {}),
            ...settings,
          },
        }
      : current);
  }, []);

  const handleImportState = useCallback((importedState: GameState) => {
    const normalized = normalizeState(importedState);
    setState(normalized);
    setGeneratedScene(null);
    showNotification({ app: "Beacon", body: "Save JSON imported." });
  }, [showNotification]);

  const handleImportWorldPack = useCallback((pack: WorldPack, sourceFileName?: string) => {
    if (!state) return { name: "World pack", npcCount: 0, locationCount: 0, scheduleCount: 0, arcCount: 0 };
    const result = applyWorldPack(state, pack, sourceFileName);
    setState(normalizeState(result.state));
    showNotification({
      app: "Beacon",
      body: `World pack imported: ${result.summary.npcCount} NPCs, ${result.summary.locationCount} locations.`,
    });
    return result.summary;
  }, [showNotification, state]);

  if (!loaded || !state) {
    return <main className="loading-screen">Loading...</main>;
  }

  const narratorSettings = { ...DEFAULT_NARRATOR_SETTINGS, ...(state.narrator || {}) };
  const scene = generatedScene || getScriptedScene(state);
  const phoneIsOpen = phone.open;
  const isLandscape = phone.orientation === "landscape";

  let phoneContent = <PhoneHomeScreen state={state} onOpenApp={openApp} />;
  if (phone.view.startsWith("app:")) {
    const appId = phone.view.slice(4);
    const app = APP_BY_ID[appId];
    if (appId === "compass") phoneContent = <CompassApp state={state} onNavigate={handleNavigate} />;
    else if (appId === "pulse") phoneContent = <PulseApp state={state} onSendMessage={handleSendMessage} />;
    else if (appId === "roster") phoneContent = <RosterApp state={state} />;
    else if (appId === "self") phoneContent = <SelfApp state={state} />;
    else if (appId === "buzz") phoneContent = <BuzzApp state={state} />;
    else if (appId === "anthrop") phoneContent = <AnthropApp state={state} />;
    else if (appId === "margin") phoneContent = <MarginApp state={state} onAddNote={handleAddNote} />;
    else if (appId === "beacon") {
      phoneContent = (
        <NarratorLabApp
          state={state}
          onApplyResult={handleApplyNarratorResult}
          narratorSettings={narratorSettings}
          onNarratorSettingsChange={handleNarratorSettingsChange}
          onImportState={handleImportState}
          onImportWorldPack={handleImportWorldPack}
        />
      );
    }
    else if (app) phoneContent = <StubApp app={app} />;
  }

  return (
    <main className="game-shell">
      <section className="scene-region">
        <SceneImage location={state.location} />
        {phoneIsOpen && <div className="scene-dim" />}
        <HeaderBar state={state} onNewGame={handleNewGame} />
        <FloatingControls
          phoneOpen={phoneIsOpen}
          onTogglePhone={togglePhone}
          onOpenSelf={() => openApp("self")}
          onOpenMap={() => openApp("compass")}
        />
        <NotificationBanner
          notification={notification}
          onDismiss={() => setNotification(null)}
          onTap={() => {
            setNotification(null);
            if (notification?.app === "Pulse") openApp("pulse");
            else if (notification?.app === "Buzz") openApp("buzz");
            else openPhoneHome();
          }}
        />
        {phoneIsOpen && (
          <div className={`phone-layer ${isLandscape ? "phone-layer--landscape" : "phone-layer--portrait"}`}>
            <PhoneFrame orientation={phone.orientation} onClose={togglePhone}>
              {phoneContent}
            </PhoneFrame>
          </div>
        )}
      </section>
      <DialogueStrip scene={scene} onChoice={handleChoice} busy={generatingScene} />
    </main>
  );
}
