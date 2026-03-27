export type ActiveFilters = {
  noConstraints: boolean;
  fridgeOnly: boolean;
  underTwentyMin: boolean;
  underThirtyMin: boolean;
  highProtein: boolean;
  preWorkout: boolean;
  budget: boolean;
  underFiveHundredKcal: boolean;
  vegetarianOnly: boolean;
  veganOnly: boolean;
  glutenFreeOnly: boolean;
  dairyFreeOnly: boolean;
  nutFreeOnly: boolean;
  lowCarb: boolean;
  highFiber: boolean;
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
  photoPaths?: string[];
  category: "breakfast" | "protein" | "veggie" | "carbs" | "light" | "snack";
  colorTheme: "amber" | "coral" | "green" | "teal" | "blue";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  satiating: number;
  prepMinutes: number;
  cookMinutes: number;
  difficulty: 1 | 2 | 3;
  tags: string[];
  ingredients: IngredientEntry[];
  steps: string[];
  tools: string[];
  allergens: string[];
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
  photoPaths: string;
  category: string;
  colorTheme: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  satiating: number;
  prepMinutes: number;
  cookMinutes: number;
  difficulty: number;
  tags: string;
  ingredients: string;
  steps: string;
  tools: string;
  allergens: string;
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
  "tags" | "ingredients" | "steps" | "tools" | "allergens" | "photoPaths"
> & {
  tags: string[];
  ingredients: IngredientEntry[];
  steps: string[];
  tools: string[];
  allergens: string[];
  photoPaths: string[];
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

export type LoggedMeal = {
  id: string;
  mealId: string | null;
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: string;
};

export type TodayLog = {
  id?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: LoggedMeal[];
};

export type SwipeRecord = {
  mealId: string;
  direction: "left" | "right";
  swipedAt: Date;
};
