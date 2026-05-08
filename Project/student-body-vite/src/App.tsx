import { useCallback, useEffect, useRef, useState } from "react";
import { APP_BY_ID } from "./data/apps";
import { getScriptedScene } from "./engine/scriptedScenes";
import { makeFreshState } from "./engine/state";
import { applyChoice, navigateToLocation } from "./engine/transitions";
import { clearState, loadState, saveState } from "./services/storage";
import type { Choice, GameState, LocationId } from "./types/game";
import { CompassApp } from "./ui/apps/CompassApp";
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

export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [phone, setPhone] = useState<PhoneState>({ open: false, view: "home", orientation: "portrait" });
  const [notification, setNotification] = useState<Notification | null>(null);
  const notificationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let live = true;
    loadState().then(saved => {
      if (!live) return;
      setState(saved || makeFreshState());
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
    setPhone({ open: false, view: "home", orientation: "portrait" });
    setNotification(null);
  }, []);

  const handleNavigate = useCallback((location: LocationId) => {
    setState(current => {
      if (!current) return current;
      return navigateToLocation(current, location).state;
    });
    setPhone({ open: false, view: "home", orientation: "portrait" });
  }, []);

  const handleChoice = useCallback((choice: Choice) => {
    if (!state) return;
    const update = applyChoice(state, choice);
    setState(update.state);
    if (update.notification) window.setTimeout(() => showNotification(update.notification!), 600);
  }, [showNotification, state]);

  if (!loaded || !state) {
    return <main className="loading-screen">Loading...</main>;
  }

  const scene = getScriptedScene(state);
  const phoneIsOpen = phone.open;
  const isLandscape = phone.orientation === "landscape";

  let phoneContent = <PhoneHomeScreen state={state} onOpenApp={openApp} />;
  if (phone.view.startsWith("app:")) {
    const appId = phone.view.slice(4);
    const app = APP_BY_ID[appId];
    if (appId === "compass") phoneContent = <CompassApp state={state} onNavigate={handleNavigate} />;
    else if (appId === "roster") phoneContent = <RosterApp state={state} />;
    else if (appId === "self") phoneContent = <SelfApp state={state} />;
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
            openPhoneHome();
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
      <DialogueStrip scene={scene} onChoice={handleChoice} />
    </main>
  );
}
