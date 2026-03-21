"use client";

import { useQuery } from "@tanstack/react-query";

type LoggedMeal = {
  id: string;
  mealId: string | null;
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string;
};

type TodayLog = {
  id?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: LoggedMeal[];
};

const fetchTodayLog = async (): Promise<TodayLog> => {
  const response = await fetch("/api/log/today");
  if (!response.ok) {
    throw new Error("Failed to load today's log");
  }
  return response.json() as Promise<TodayLog>;
};

export function useTodayLog() {
  return useQuery({
    queryKey: ["log", "today"],
    queryFn: fetchTodayLog,
    staleTime: 30_000,
  });
}
