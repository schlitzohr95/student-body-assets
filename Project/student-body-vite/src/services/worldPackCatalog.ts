import type { WorldPack } from "../types/game";

export interface WorldPackCatalogEntry {
  id: string;
  name: string;
  description?: string;
  path: string;
  npcCount?: number;
  locationCount?: number;
  tags?: string[];
}

interface WorldPackManifest {
  packs?: WorldPackCatalogEntry[];
}

const MANIFEST_PATH = "/world-packs/manifest.json";

function packUrl(path: string) {
  return path.startsWith("/") ? path : `/world-packs/${path}`;
}

export async function fetchWorldPackCatalog(): Promise<WorldPackCatalogEntry[]> {
  const response = await fetch(MANIFEST_PATH, { cache: "no-store" });
  if (!response.ok) throw new Error(`World pack manifest returned ${response.status}`);
  const manifest = await response.json() as WorldPackManifest;
  return Array.isArray(manifest.packs)
    ? manifest.packs.filter(pack => pack.id && pack.name && pack.path)
    : [];
}

export async function fetchWorldPack(entry: WorldPackCatalogEntry): Promise<WorldPack> {
  const response = await fetch(packUrl(entry.path), { cache: "no-store" });
  if (!response.ok) throw new Error(`World pack ${entry.name} returned ${response.status}`);
  return await response.json() as WorldPack;
}
