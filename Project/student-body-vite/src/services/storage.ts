import type { GameState } from "../types/game";

const STORAGE_KEY = "student-body:vite:state";

type ArtifactStorage = {
  get?: (key: string) => Promise<{ value: string } | null>;
  set?: (key: string, value: string) => Promise<void>;
  delete?: (key: string) => Promise<void>;
  getItem?: (key: string) => Promise<string | null>;
  setItem?: (key: string, value: string) => Promise<void>;
  removeItem?: (key: string) => Promise<void>;
};

declare global {
  interface Window {
    storage?: ArtifactStorage;
  }
}

export async function loadState(): Promise<GameState | null> {
  try {
    if (window.storage?.get) {
      const result = await window.storage.get(STORAGE_KEY);
      return result?.value ? JSON.parse(result.value) as GameState : null;
    }
    if (window.storage?.getItem) {
      const result = await window.storage.getItem(STORAGE_KEY);
      return result ? JSON.parse(result) as GameState : null;
    }
    const local = window.localStorage.getItem(STORAGE_KEY);
    return local ? JSON.parse(local) as GameState : null;
  } catch {
    return null;
  }
}

export async function saveState(state: GameState): Promise<void> {
  const serialized = JSON.stringify(state);
  try {
    if (window.storage?.set) {
      await window.storage.set(STORAGE_KEY, serialized);
      return;
    }
    if (window.storage?.setItem) {
      await window.storage.setItem(STORAGE_KEY, serialized);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // Persistence is nice-to-have in dev; the game should still run without it.
  }
}

export async function clearState(): Promise<void> {
  try {
    if (window.storage?.delete) {
      await window.storage.delete(STORAGE_KEY);
      return;
    }
    if (window.storage?.removeItem) {
      await window.storage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Non-fatal.
  }
}
