import type { PhoneAppDefinition } from "../types/game";

export const APPS: PhoneAppDefinition[] = [
  { id: "compass", label: "Compass", role: "Navigation", layout: "landscape", implemented: true },
  { id: "pulse", label: "Pulse", role: "Messages", layout: "portrait", implemented: false },
  { id: "roster", label: "Roster", role: "Contacts", layout: "portrait", implemented: true },
  { id: "self", label: "Self", role: "Stats", layout: "portrait", implemented: true },
  { id: "buzz", label: "Buzz", role: "Campus feed", layout: "landscape", implemented: false },
  { id: "anthrop", label: "Anthrop", role: "Assistant", layout: "landscape", implemented: false },
  { id: "spark", label: "Spark", role: "Dating", layout: "landscape", implemented: false },
  { id: "margin", label: "Margin", role: "Notes", layout: "portrait", implemented: false },
  { id: "lens", label: "Lens", role: "Camera", layout: "landscape", implemented: false },
  { id: "wake", label: "Wake", role: "Alarm", layout: "portrait", implemented: false },
  { id: "beacon", label: "Beacon", role: "Browser", layout: "landscape", implemented: false },
];

export const APP_BY_ID = Object.fromEntries(APPS.map(app => [app.id, app])) as Record<string, PhoneAppDefinition>;
