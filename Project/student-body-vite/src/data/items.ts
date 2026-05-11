import type { InventoryItemKind, LocationId, StatKey } from "../types/game";

export interface ItemDefinition {
  id: string;
  label: string;
  kind: InventoryItemKind;
  description: string;
  price: number;
  locations: LocationId[];
  energyDelta?: number;
  statDeltas?: Partial<Record<StatKey, number>>;
  trait?: string;
  flags?: Record<string, boolean | number | string>;
  unique?: boolean;
}

export const ITEMS: Record<string, ItemDefinition> = {
  drip_coffee: {
    id: "drip_coffee",
    label: "Drip Coffee",
    kind: "coffee",
    description: "Cheap caffeine, enough to keep the next block from sagging.",
    price: 3,
    locations: ["coffee_shop", "student_union"],
    energyDelta: 6,
  },
  fancy_latte: {
    id: "fancy_latte",
    label: "House Latte",
    kind: "coffee",
    description: "Costs more than it should, but it makes lingering feel intentional.",
    price: 5,
    locations: ["coffee_shop"],
    energyDelta: 8,
    statDeltas: { charm: 1 },
  },
  pastry: {
    id: "pastry",
    label: "Counter Pastry",
    kind: "food",
    description: "A fast bite that turns coffee into something almost like breakfast.",
    price: 4,
    locations: ["coffee_shop"],
    energyDelta: 9,
  },
  dining_meal: {
    id: "dining_meal",
    label: "Dining Hall Meal",
    kind: "food",
    description: "A real meal: not glamorous, but it steadies the whole afternoon.",
    price: 6,
    locations: ["dining_hall"],
    energyDelta: 20,
  },
  snack_pack: {
    id: "snack_pack",
    label: "Snack Pack",
    kind: "food",
    description: "Shelf-stable emergency calories for a long study block.",
    price: 5,
    locations: ["bookstore", "student_union"],
    energyDelta: 10,
  },
  school_supplies: {
    id: "school_supplies",
    label: "School Supplies",
    kind: "study",
    description: "Notebooks, pens, tabs: small tools for making future studying less frictional.",
    price: 8,
    locations: ["bookstore", "student_union"],
    statDeltas: { grit: 1 },
  },
  bus_pass: {
    id: "bus_pass",
    label: "Bus Pass",
    kind: "transit",
    description: "Covers bus fares and makes long town hops less punishing.",
    price: 18,
    locations: ["student_union"],
    flags: { busPass: true },
    trait: "bus-pass",
    unique: true,
  },
  used_bike: {
    id: "used_bike",
    label: "Used Bike",
    kind: "transit",
    description: "A rough but working bike that cuts travel time without bus fare.",
    price: 65,
    locations: ["bookstore"],
    flags: { bikeOwned: true },
    trait: "bike-owner",
    unique: true,
  },
};
