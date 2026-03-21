"use client";

import { useQuery } from "@tanstack/react-query";

type Profile = {
  id: string;
  userId: string;
  weightKg: number;
  heightCm: number;
  age: number;
  sex: string;
  goal: string;
  activityLevel: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  calculatedTdee: number;
  dietaryFilters: string;
  dislikedIngredients: string;
  cuisinePrefs: string;
  cookingSkill: string;
  budget: string;
  trainingDays: string;
};

const fetchProfile = async (): Promise<Profile> => {
  const response = await fetch("/api/profile");
  if (!response.ok) {
    throw new Error("Failed to load profile");
  }
  return response.json() as Promise<Profile>;
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 60_000,
  });
}
