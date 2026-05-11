import { ITEMS, type ItemDefinition } from "../data/items";
import type { GameState, GameUpdate, InventoryItemStack, LocationId, StatKey } from "../types/game";
import { appendEvent } from "./state";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function changeStats(state: GameState, changes: Partial<Record<StatKey, number>> = {}) {
  const stats = { ...state.player.stats };
  for (const [stat, delta] of Object.entries(changes) as Array<[StatKey, number]>) {
    stats[stat] = clamp(stats[stat] + delta);
  }
  return { ...state, player: { ...state.player, stats } };
}

function addTrait(state: GameState, trait?: string) {
  if (!trait) return state;
  const traits = state.player.traits || [];
  if (traits.includes(trait)) return state;
  return { ...state, player: { ...state.player, traits: [...traits, trait] } };
}

function addInventoryItem(state: GameState, item: ItemDefinition): GameState {
  const current = state.player.inventory?.[item.id];
  const nextStack: InventoryItemStack = {
    itemId: item.id,
    quantity: item.unique ? 1 : (current?.quantity || 0) + 1,
    acquiredDay: current?.acquiredDay || state.day,
    acquiredSlot: current?.acquiredSlot || state.timeSlot,
  };

  return {
    ...state,
    player: {
      ...state.player,
      inventory: {
        ...(state.player.inventory || {}),
        [item.id]: nextStack,
      },
    },
  };
}

export function inventoryCount(state: GameState, itemId: string) {
  return state.player.inventory?.[itemId]?.quantity || 0;
}

export function inventoryEntries(state: GameState) {
  return Object.values(state.player.inventory || {})
    .filter(stack => stack.quantity > 0)
    .map(stack => ({ stack, item: ITEMS[stack.itemId] }))
    .filter(entry => entry.item);
}

export function ownsItem(state: GameState, itemId: string) {
  return inventoryCount(state, itemId) > 0;
}

export function canPurchaseItem(state: GameState, itemId: string) {
  const item = ITEMS[itemId];
  if (!item) return { ok: false, reason: "Item unavailable." };
  if (item.unique && ownsItem(state, itemId)) return { ok: false, reason: "Already owned." };
  if (state.player.resources.money < item.price) return { ok: false, reason: `Need $${item.price}.` };
  return { ok: true, reason: "" };
}

export function getShopInventory(state: GameState, locationId: LocationId = state.location) {
  return Object.values(ITEMS).filter(item => item.locations.includes(locationId));
}

export function describeItemEffects(item: ItemDefinition) {
  const parts: string[] = [];
  if (item.energyDelta) parts.push(`${item.energyDelta > 0 ? "+" : ""}${item.energyDelta} energy`);
  if (item.statDeltas) {
    for (const [stat, delta] of Object.entries(item.statDeltas)) {
      parts.push(`${Number(delta) > 0 ? "+" : ""}${delta} ${stat}`);
    }
  }
  if (item.trait) parts.push(item.trait);
  if (item.flags?.busPass) parts.push("free bus rides");
  if (item.flags?.bikeOwned) parts.push("faster travel");
  return parts.length ? parts.join(" · ") : "inventory";
}

export function purchaseItem(state: GameState, itemId: string): GameUpdate {
  const item = ITEMS[itemId];
  const check = canPurchaseItem(state, itemId);
  if (!item || !check.ok) return { state, notification: { app: "Shop", body: check.reason || "Cannot buy that right now." } };

  let next: GameState = {
    ...state,
    player: {
      ...state.player,
      resources: {
        ...state.player.resources,
        money: Math.max(0, state.player.resources.money - item.price),
        energy: clamp(state.player.resources.energy + (item.energyDelta || 0)),
      },
    },
    flags: {
      ...(state.flags || {}),
      ...(item.flags || {}),
    },
  };

  next = changeStats(next, item.statDeltas);
  next = addTrait(next, item.trait);
  next = addInventoryItem(next, item);
  next = appendEvent(next, `Bought ${item.label} for $${item.price}.`);

  return {
    state: next,
    notification: { app: "Shop", body: `${item.label}: ${describeItemEffects(item)}.` },
  };
}
