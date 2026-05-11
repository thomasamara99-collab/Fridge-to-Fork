"use client";

import { useQuery } from "@tanstack/react-query";

import type { SavedMealItem } from "../types";

const fetchSavedMeals = async (): Promise<SavedMealItem[]> => {
  const response = await fetch("/api/meals/saved");
  if (!response.ok) {
    throw new Error("Failed to load saved meals");
  }
  return response.json() as Promise<SavedMealItem[]>;
};

export function useSavedMeals() {
  return useQuery({
    queryKey: ["saved-meals"],
    queryFn: fetchSavedMeals,
    staleTime: 30_000,
  });
}
