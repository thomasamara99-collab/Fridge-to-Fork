"use client";

import { useQuery } from "@tanstack/react-query";

import type { ActiveFilters, MealFeedItem } from "../types";

type MealFeedParams = {
  filters: ActiveFilters;
  hungerLevel: number;
  limit?: number;
  includeHungerInKey?: boolean;
  excludeMealIds?: string[];
};

export const fetchMealFeed = async (
  filters: ActiveFilters,
  hungerLevel: number,
  limit = 12,
  excludeMealIds: string[] = [],
): Promise<MealFeedItem[]> => {
  const params = new URLSearchParams();
  params.set("filters", JSON.stringify(filters));
  params.set("hunger", String(hungerLevel));
  params.set("limit", String(limit));
  if (excludeMealIds.length) {
    params.set("excludeMealIds", excludeMealIds.join(","));
  }

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
  excludeMealIds = [],
}: MealFeedParams) {
  const queryKey = includeHungerInKey
    ? ["meal-feed", filters, hungerLevel, limit, excludeMealIds]
    : ["meal-feed", filters, limit, excludeMealIds];

  return useQuery({
    queryKey,
    queryFn: () => fetchMealFeed(filters, hungerLevel, limit, excludeMealIds),
  });
}
