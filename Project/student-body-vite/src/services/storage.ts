import type { GameState } from "../types/game";

const STORAGE_KEY = "student-body:vite:state";
const SAVE_SLOT_PREFIX = "student-body:vite:slot:";
const BACKUP_PREFIX = "student-body:vite:backup:";
const BACKUP_INDEX_KEY = "student-body:vite:backup-index";
const BACKUP_LIMIT = 6;

export const SAVE_SLOT_IDS = ["slot-1", "slot-2", "slot-3", "slot-4"] as const;
export type SaveSlotId = typeof SAVE_SLOT_IDS[number];

export interface StoredGameArchive {
  exportKind: "student-body-save";
  savedAt: string;
  reason?: string;
  slotId?: string;
  state: GameState;
}

export interface SaveSlotMeta {
  id: string;
  label: string;
  isEmpty: boolean;
  savedAt?: string;
  reason?: string;
  day?: number;
  timeSlot?: number;
  location?: string;
}

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

function slotLabel(slotId: string) {
  const index = SAVE_SLOT_IDS.indexOf(slotId as SaveSlotId);
  return index >= 0 ? `Slot ${index + 1}` : slotId;
}

async function readStoredValue(key: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (window.storage?.get) {
    const result = await window.storage.get(key);
    return result?.value || null;
  }
  if (window.storage?.getItem) return window.storage.getItem(key);
  return window.localStorage.getItem(key);
}

async function writeStoredValue(key: string, value: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.storage?.set) {
    await window.storage.set(key, value);
    return;
  }
  if (window.storage?.setItem) {
    await window.storage.setItem(key, value);
    return;
  }
  window.localStorage.setItem(key, value);
}

async function removeStoredValue(key: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.storage?.delete) {
    await window.storage.delete(key);
    return;
  }
  if (window.storage?.removeItem) {
    await window.storage.removeItem(key);
    return;
  }
  window.localStorage.removeItem(key);
}

function archiveForState(state: GameState, reason?: string, slotId?: string): StoredGameArchive {
  return {
    exportKind: "student-body-save",
    savedAt: new Date().toISOString(),
    reason,
    slotId,
    state,
  };
}

function parseArchive(raw: string | null): StoredGameArchive | null {
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw) as (Partial<StoredGameArchive> & { exportedAt?: string; state?: GameState }) | GameState;
    if (payload && typeof payload === "object" && "state" in payload) {
      return {
        exportKind: "student-body-save",
        savedAt: payload.savedAt || payload.exportedAt || new Date().toISOString(),
        reason: payload.reason,
        slotId: payload.slotId,
        state: payload.state as GameState,
      };
    }
    return {
      exportKind: "student-body-save",
      savedAt: new Date().toISOString(),
      state: payload as GameState,
    };
  } catch {
    return null;
  }
}

function metaFromArchive(id: string, label: string, archive: StoredGameArchive | null): SaveSlotMeta {
  if (!archive) return { id, label, isEmpty: true };
  return {
    id,
    label,
    isEmpty: false,
    savedAt: archive.savedAt,
    reason: archive.reason,
    day: archive.state?.day,
    timeSlot: archive.state?.timeSlot,
    location: archive.state?.location,
  };
}

function saveSlotKey(slotId: string) {
  return `${SAVE_SLOT_PREFIX}${slotId}`;
}

function backupKey(backupId: string) {
  return `${BACKUP_PREFIX}${backupId}`;
}

async function readBackupIndex(): Promise<string[]> {
  const raw = await readStoredValue(BACKUP_INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

async function writeBackupIndex(ids: string[]) {
  await writeStoredValue(BACKUP_INDEX_KEY, JSON.stringify(ids));
}

export async function loadState(): Promise<GameState | null> {
  try {
    const stored = await readStoredValue(STORAGE_KEY);
    return stored ? JSON.parse(stored) as GameState : null;
  } catch {
    return null;
  }
}

export async function saveState(state: GameState): Promise<void> {
  const serialized = JSON.stringify(state);
  try {
    await writeStoredValue(STORAGE_KEY, serialized);
  } catch {
    // Persistence is nice-to-have in dev; the game should still run without it.
  }
}

export async function clearState(): Promise<void> {
  try {
    await removeStoredValue(STORAGE_KEY);
  } catch {
    // Non-fatal.
  }
}

export async function listSaveSlots(): Promise<SaveSlotMeta[]> {
  const slots = await Promise.all(SAVE_SLOT_IDS.map(async slotId => {
    const archive = parseArchive(await readStoredValue(saveSlotKey(slotId)));
    return metaFromArchive(slotId, slotLabel(slotId), archive);
  }));
  return slots;
}

export async function saveStateToSlot(slotId: SaveSlotId, state: GameState): Promise<SaveSlotMeta> {
  const archive = archiveForState(state, "Manual save", slotId);
  await writeStoredValue(saveSlotKey(slotId), JSON.stringify(archive));
  return metaFromArchive(slotId, slotLabel(slotId), archive);
}

export async function loadStateFromSlot(slotId: SaveSlotId): Promise<GameState | null> {
  const archive = parseArchive(await readStoredValue(saveSlotKey(slotId)));
  return archive?.state || null;
}

export async function clearSaveSlot(slotId: SaveSlotId): Promise<void> {
  await removeStoredValue(saveSlotKey(slotId));
}

export async function createStateBackup(state: GameState, reason: string): Promise<SaveSlotMeta> {
  const backupId = `backup-${Date.now()}`;
  const archive = archiveForState(state, reason, backupId);
  await writeStoredValue(backupKey(backupId), JSON.stringify(archive));

  const nextIndex = [backupId, ...(await readBackupIndex()).filter(id => id !== backupId)];
  const kept = nextIndex.slice(0, BACKUP_LIMIT);
  const dropped = nextIndex.slice(BACKUP_LIMIT);
  await writeBackupIndex(kept);
  await Promise.all(dropped.map(id => removeStoredValue(backupKey(id))));

  return metaFromArchive(backupId, "Backup", archive);
}

export async function listStateBackups(): Promise<SaveSlotMeta[]> {
  const ids = await readBackupIndex();
  const backups = await Promise.all(ids.map(async backupId => {
    const archive = parseArchive(await readStoredValue(backupKey(backupId)));
    return metaFromArchive(backupId, archive?.reason || "Backup", archive);
  }));
  return backups.filter(backup => !backup.isEmpty);
}

export async function loadStateBackup(backupId: string): Promise<GameState | null> {
  const archive = parseArchive(await readStoredValue(backupKey(backupId)));
  return archive?.state || null;
}
