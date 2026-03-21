"use client";

import { useQuery } from "@tanstack/react-query";

import type { ActiveFilters, MealFeedItem } from "../types";

type MealFeedParams = {
  filters: ActiveFilters;
  hungerLevel: number;
  limit?: number;
  includeHungerInKey?: boolean;
};

export const fetchMealFeed = async (
  filters: ActiveFilters,
  hungerLevel: number,
  limit = 5,
): Promise<MealFeedItem[]> => {
  const params = new URLSearchParams();
  params.set("filters", JSON.stringify(filters));
  params.set("hunger", String(hungerLevel));
  params.set("limit", String(limit));

  const response = await fetch(`/api/meals/feed?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to load meal feed");
  }
  return response.json() as Promise<MealFeedItem[]>;
};

export function useMealFeed({
  filters,
  hungerLevel,
  limit,
  includeHungerInKey = true,
}: MealFeedParams) {
  const queryKey = includeHungerInKey
    ? ["meal-feed", filters, hungerLevel, limit]
    : ["meal-feed", filters, limit];

  return useQuery({
    queryKey,
    queryFn: () => fetchMealFeed(filters, hungerLevel, limit),
  });
}
