import { create } from "zustand";
import { persist } from "zustand/middleware";

type GoalPreset = "cut" | "maintain" | "bulk" | "";
type GoalFinal = GoalPreset | "custom";

type OnboardingState = {
  name: string;
  age: number | null;
  sex: "male" | "female" | "other" | "";
  weightKg: number | null;
  heightCm: number | null;
  goalPreset: GoalPreset;
  goal: GoalFinal;
  useSuggested: boolean;
  targetCalories: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFat: number | null;
  calculatedTdee: number | null;
  setStep1: (data: {
    name: string;
    age: number;
    sex: "male" | "female" | "other";
    weightKg: number;
    heightCm: number;
  }) => void;
  setGoalPreset: (goal: GoalPreset) => void;
  setTargets: (data: {
    useSuggested: boolean;
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    calculatedTdee: number;
    goal: GoalFinal;
  }) => void;
  reset: () => void;
};

const defaultState = {
  name: "",
  age: null,
  sex: "",
  weightKg: null,
  heightCm: null,
  goalPreset: "",
  goal: "",
  useSuggested: false,
  targetCalories: null,
  targetProtein: null,
  targetCarbs: null,
  targetFat: null,
  calculatedTdee: null,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...defaultState,
      setStep1: (data) =>
        set({
          name: data.name,
          age: data.age,
          sex: data.sex,
          weightKg: data.weightKg,
          heightCm: data.heightCm,
        }),
      setGoalPreset: (goal) => set({ goalPreset: goal, goal }),
      setTargets: (data) =>
        set({
          useSuggested: data.useSuggested,
          targetCalories: data.targetCalories,
          targetProtein: data.targetProtein,
          targetCarbs: data.targetCarbs,
          targetFat: data.targetFat,
          calculatedTdee: data.calculatedTdee,
          goal: data.goal,
        }),
      reset: () => set(defaultState),
    }),
    {
      name: "fridge-to-fork-onboarding",
    },
  ),
);
