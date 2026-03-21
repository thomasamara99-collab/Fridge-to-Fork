export type ActiveFilters = {
  fridgeOnly: boolean;
  underTwentyMin: boolean;
  highProtein: boolean;
  preWorkout: boolean;
  budget: boolean;
  underFiveHundredKcal: boolean;
};

export type IngredientEntry = {
  name: string;
  amount: string;
  category: string;
};

export type MealData = {
  name: string;
  description: string;
  emoji: string;
  photoPath?: string | null;
  category: "breakfast" | "protein" | "veggie" | "carbs" | "light" | "snack";
  colorTheme: "amber" | "coral" | "green" | "teal" | "blue";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  prepMinutes: number;
  cookMinutes: number;
  difficulty: 1 | 2 | 3;
  tags: string[];
  ingredients: IngredientEntry[];
  steps: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isDairyFree: boolean;
  isHalal: boolean;
  isKosher: boolean;
  isNutFree: boolean;
};

export type MealRecord = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  photoPath: string | null;
  category: string;
  colorTheme: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  prepMinutes: number;
  cookMinutes: number;
  difficulty: number;
  tags: string;
  ingredients: string;
  steps: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isDairyFree: boolean;
  isHalal: boolean;
  isKosher: boolean;
  isNutFree: boolean;
};

export type MealMatch = MealRecord & {
  matchScore: number;
  computedTags: string[];
  fridgeScore: number;
  macroScore: number;
  contextScore: number;
};

export type MealFeedItem = Omit<
  MealMatch,
  "tags" | "ingredients" | "steps"
> & {
  tags: string[];
  ingredients: IngredientEntry[];
  steps: string[];
};

export type ProfileRecord = {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  dietaryFilters: string;
  dislikedIngredients: string;
  cuisinePrefs: string;
  cookingSkill: string;
  budget: string;
  trainingDays: string;
};

export type DailyLogRecord = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type SwipeRecord = {
  mealId: string;
  direction: "left" | "right";
  swipedAt: Date;
};
