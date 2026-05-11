"use client";

import { useQuery } from "@tanstack/react-query";

import type { LogStats } from "../types";

const fetchLogStats = async (): Promise<LogStats> => {
  const response = await fetch("/api/log/stats");
  if (!response.ok) {
    throw new Error("Failed to load stats");
  }
  return response.json() as Promise<LogStats>;
};

export function useLogStats() {
  return useQuery({
    queryKey: ["log", "stats"],
    queryFn: fetchLogStats,
    staleTime: 60_000,
  });
}
