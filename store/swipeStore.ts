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
  noConstraints: false,
  fridgeOnly: true,
  underTwentyMin: false,
  underThirtyMin: false,
  highProtein: false,
  preWorkout: false,
  budget: false,
  underFiveHundredKcal: false,
  vegetarianOnly: false,
  veganOnly: false,
  glutenFreeOnly: false,
  dairyFreeOnly: false,
  nutFreeOnly: false,
  lowCarb: false,
  highFiber: false,
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
    set((state) => {
      if (key === "noConstraints") {
        const next = !state.filters.noConstraints;
        if (next) {
          return {
            filters: {
              ...state.filters,
              noConstraints: true,
              fridgeOnly: false,
              underTwentyMin: false,
              underThirtyMin: false,
              highProtein: false,
              preWorkout: false,
              budget: false,
              underFiveHundredKcal: false,
              vegetarianOnly: false,
              veganOnly: false,
              glutenFreeOnly: false,
              dairyFreeOnly: false,
              nutFreeOnly: false,
              lowCarb: false,
              highFiber: false,
            },
          };
        }
        return { filters: { ...state.filters, noConstraints: false } };
      }

      return {
        filters: {
          ...state.filters,
          noConstraints: false,
          [key]: !state.filters[key],
        },
      };
    }),
  setFilters: (filters) => set({ filters }),
}));
