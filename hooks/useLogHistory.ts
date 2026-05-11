"use client";

import { useQuery } from "@tanstack/react-query";

import type { LogHistoryDay } from "../types";

const fetchLogHistory = async (days = 30): Promise<LogHistoryDay[]> => {
  const response = await fetch(`/api/log/history?days=${days}`);
  if (!response.ok) {
    throw new Error("Failed to load log history");
  }
  return response.json() as Promise<LogHistoryDay[]>;
};

export function useLogHistory(days = 30) {
  return useQuery({
    queryKey: ["log", "history", days],
    queryFn: () => fetchLogHistory(days),
    staleTime: 30_000,
  });
}
