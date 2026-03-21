import { create } from "zustand";

import type { ActiveFilters, MealFeedItem } from "../types";

type SwipeState = {
  deck: MealFeedItem[];
  filters: ActiveFilters;
  hungerLevel: number;
  setDeck: (deck: MealFeedItem[]) => void;
  appendDeck: (deck: MealFeedItem[]) => void;
  shiftDeck: () => MealFeedItem | null;
  setHungerLevel: (level: number) => void;
  toggleFilter: (key: keyof ActiveFilters) => void;
  setFilters: (filters: ActiveFilters) => void;
};

const defaultFilters: ActiveFilters = {
  fridgeOnly: true,
  underTwentyMin: false,
  highProtein: false,
  preWorkout: false,
  budget: false,
  underFiveHundredKcal: false,
};

export const useSwipeStore = create<SwipeState>((set, get) => ({
  deck: [],
  filters: defaultFilters,
  hungerLevel: 3,
  setDeck: (deck) => set({ deck }),
  appendDeck: (deck) => set({ deck: [...get().deck, ...deck] }),
  shiftDeck: () => {
    const [first, ...rest] = get().deck;
    set({ deck: rest });
    return first ?? null;
  },
  setHungerLevel: (level) => set({ hungerLevel: level }),
  toggleFilter: (key) =>
    set((state) => ({
      filters: { ...state.filters, [key]: !state.filters[key] },
    })),
  setFilters: (filters) => set({ filters }),
}));
