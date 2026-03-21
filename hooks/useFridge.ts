"use client";

import { useQuery } from "@tanstack/react-query";

type FridgeItem = {
  id: string;
  name: string;
  category: string;
  quantity: string | null;
  expiresAt: string | null;
  updatedAt: string;
};

const fetchFridge = async (): Promise<FridgeItem[]> => {
  const response = await fetch("/api/fridge");
  if (!response.ok) {
    throw new Error("Failed to load fridge");
  }
  return response.json() as Promise<FridgeItem[]>;
};

export function useFridge() {
  return useQuery({
    queryKey: ["fridge"],
    queryFn: fetchFridge,
    staleTime: 60_000,
  });
}
