import { create } from "zustand";
import { persist } from "zustand/middleware";

type GoalPreset = "cut" | "maintain" | "bulk" | "";
type GoalFinal = GoalPreset | "custom";
type DietaryFilter =
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "gluten-free"
  | "dairy-free"
  | "halal"
  | "kosher"
  | "nut-free";

type FridgeItemInput = {
  name: string;
  category: string;
};

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
  dietaryFilters: DietaryFilter[];
  dislikedIngredients: string[];
  cuisinePrefs: string[];
  cookingSkill: "beginner" | "intermediate" | "advanced";
  budget: "low" | "medium" | "high";
  trainingDays: number[];
  fridgeItems: FridgeItemInput[];
  nextShopDate: string | null;
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
  setStep4: (data: {
    dietaryFilters: DietaryFilter[];
    dislikedIngredients: string[];
    cookingSkill: "beginner" | "intermediate" | "advanced";
    budget: "low" | "medium" | "high";
  }) => void;
  setStep5: (days: number[]) => void;
  setStep6: (data: { fridgeItems: FridgeItemInput[]; nextShopDate: string | null }) => void;
  reset: () => void;
};

const defaultState: Omit<
  OnboardingState,
  "setStep1" | "setGoalPreset" | "setTargets" | "setStep4" | "setStep5" | "setStep6" | "reset"
> = {
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
  dietaryFilters: [],
  dislikedIngredients: [],
  cuisinePrefs: [],
  cookingSkill: "beginner",
  budget: "medium",
  trainingDays: [],
  fridgeItems: [],
  nextShopDate: null,
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
      setStep4: (data) =>
        set({
          dietaryFilters: data.dietaryFilters,
          dislikedIngredients: data.dislikedIngredients,
          cookingSkill: data.cookingSkill,
          budget: data.budget,
        }),
      setStep5: (days) => set({ trainingDays: days }),
      setStep6: (data) =>
        set({ fridgeItems: data.fridgeItems, nextShopDate: data.nextShopDate }),
      reset: () => set(defaultState),
    }),
    {
      name: "fridge-to-fork-onboarding",
    },
  ),
);
