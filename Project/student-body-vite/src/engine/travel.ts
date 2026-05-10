import { formatDuration } from "../data/locations";
import type { GameState, LocationCategory, LocationDefinition, LocationId } from "../types/game";
import { getLocationDirectory } from "./calendar";

export interface TravelPlan {
  from: LocationId;
  to: LocationId;
  fromLabel: string;
  toLabel: string;
  mode: "Walk" | "Bike" | "Bus";
  durationChunks: number;
  durationLabel: string;
  energyCost: number;
  moneyCost: number;
  costLabel: string;
  canAfford: boolean;
  blockedReason?: string;
}

function catDistance(fromCat?: LocationCategory, toCat?: LocationCategory) {
  if (!fromCat || !toCat) return 3;
  if (fromCat === toCat) return fromCat === "campus" ? 1 : 2;
  if ((fromCat === "campus" && toCat === "town") || (fromCat === "town" && toCat === "campus")) return 2;
  return 3;
}

function hasBike(state: GameState) {
  return Boolean(state.flags?.bikeOwned || state.player.traits?.includes("bike-owner"));
}

function hasBusPass(state: GameState) {
  return Boolean(state.flags?.busPass || state.player.traits?.includes("bus-pass"));
}

export function getTravelPlan(
  state: GameState,
  toLocation: LocationId,
  locations: Record<string, LocationDefinition> = getLocationDirectory(state),
): TravelPlan {
  const fromLocation = state.location;
  const from = locations[fromLocation];
  const to = locations[toLocation];

  if (!fromLocation || !toLocation || fromLocation === toLocation) {
    return {
      from: fromLocation,
      to: toLocation,
      fromLabel: from?.label || fromLocation,
      toLabel: to?.label || toLocation,
      mode: "Walk",
      durationChunks: 0,
      durationLabel: "0m",
      energyCost: 0,
      moneyCost: 0,
      costLabel: "free",
      canAfford: true,
    };
  }

  let durationChunks = catDistance(from?.cat, to?.cat);
  let energyCost = Math.max(1, durationChunks);
  let moneyCost = 0;
  let mode: TravelPlan["mode"] = "Walk";

  if (hasBike(state) && durationChunks > 1) {
    mode = "Bike";
    durationChunks = Math.max(1, durationChunks - 1);
    energyCost = Math.max(1, energyCost - 1);
  } else if (hasBusPass(state) && durationChunks > 2) {
    mode = "Bus";
    durationChunks = Math.max(1, durationChunks - 1);
    energyCost = 1;
  }

  const canAfford = state.player.resources.money >= moneyCost;
  const energyLabel = energyCost ? `-${energyCost} energy` : "no energy";
  const moneyLabel = moneyCost ? `$${moneyCost}` : "free";

  return {
    from: fromLocation,
    to: toLocation,
    fromLabel: from?.label || fromLocation,
    toLabel: to?.label || toLocation,
    mode,
    durationChunks,
    durationLabel: formatDuration(durationChunks),
    energyCost,
    moneyCost,
    costLabel: `${energyLabel} · ${moneyLabel}`,
    canAfford,
    blockedReason: canAfford ? undefined : `Need $${moneyCost}.`,
  };
}
