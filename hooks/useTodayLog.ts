"use client";

import { useQuery } from "@tanstack/react-query";

import type { TodayLog } from "../types";

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
