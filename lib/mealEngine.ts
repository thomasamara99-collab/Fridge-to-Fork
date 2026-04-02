import "server-only";

import { prisma } from "./prisma";
import { ingredientInFridge } from "./ingredients";
import { generateFallbackMeals } from "./claude";
import type {
  ActiveFilters,
  DailyLogRecord,
  MealData,
  MealMatch,
  MealRecord,
  ProfileRecord,
  SwipeRecord,
} from "../types";

type MealEngineInput = {
  meals: MealRecord[];
  profile: ProfileRecord;
  fridgeItems: { name: string }[];
  todayLog: DailyLogRecord;
  filters: ActiveFilters;
  hungerLevel: number;
  swipes: SwipeRecord[];
  todaysCategoryCount: Record<string, number>;
  limit?: number;
};

const jsonArray = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const isTrainingDay = (trainingDays: number[]) => {
  if (!trainingDays.length) return false;
  const day = new Date().getDay();
  const normalized = day === 0 ? 7 : day;
  return trainingDays.includes(normalized);
};

const wasRecentlySwiped = (swipes: SwipeRecord[], mealId: string) => {
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const oneDayMs = 24 * 60 * 60 * 1000;

  return swipes.some((swipe) => {
    if (swipe.mealId !== mealId) return false;
    const elapsed = now - swipe.swipedAt.getTime();
    if (swipe.direction === "right") return elapsed < sevenDaysMs;
    if (swipe.direction === "left") return elapsed < oneDayMs;
    return false;
  });
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const buildMealRecordFromGenerated = (meal: MealData) => ({
  name: meal.name,
  description: meal.description,
  emoji: meal.emoji,
  photoPath: meal.photoPath ?? null,
  category: meal.category,
  colorTheme: meal.colorTheme,
  calories: meal.calories,
  protein: meal.protein,
  carbs: meal.carbs,
  fat: meal.fat,
  fibre: meal.fibre,
  prepMinutes: meal.prepMinutes,
  cookMinutes: meal.cookMinutes,
  difficulty: meal.difficulty,
  tags: JSON.stringify(meal.tags),
  ingredients: JSON.stringify(meal.ingredients),
  steps: JSON.stringify(meal.steps),
  isVegetarian: meal.isVegetarian,
  isVegan: meal.isVegan,
  isGlutenFree: meal.isGlutenFree,
  isDairyFree: meal.isDairyFree,
  isHalal: meal.isHalal,
  isKosher: meal.isKosher,
  isNutFree: meal.isNutFree,
  isSeeded: false,
  createdBy: null,
});

const passesHardFilters = (
  meal: MealRecord,
  profile: ProfileRecord,
  filters: ActiveFilters,
): { ok: boolean; tags: string[]; ingredients: { name: string }[] } => {
  const dietaryFilters = jsonArray<string[]>(profile.dietaryFilters, []);
  const disliked = jsonArray<string[]>(profile.dislikedIngredients, []);
  const tags = jsonArray<string[]>(meal.tags, []);
  const ingredients = jsonArray<{ name: string }[]>(meal.ingredients, []);

  if (dietaryFilters.includes("vegetarian") && !meal.isVegetarian) {
    return { ok: false, tags, ingredients };
  }
  if (dietaryFilters.includes("vegan") && !meal.isVegan) {
    return { ok: false, tags, ingredients };
  }
  if (dietaryFilters.includes("gluten-free") && !meal.isGlutenFree) {
    return { ok: false, tags, ingredients };
  }
  if (dietaryFilters.includes("dairy-free") && !meal.isDairyFree) {
    return { ok: false, tags, ingredients };
  }
  if (dietaryFilters.includes("halal") && !meal.isHalal) {
    return { ok: false, tags, ingredients };
  }
  if (dietaryFilters.includes("kosher") && !meal.isKosher) {
    return { ok: false, tags, ingredients };
  }
  if (dietaryFilters.includes("nut-free") && !meal.isNutFree) {
    return { ok: false, tags, ingredients };
  }

  if (filters.vegetarianOnly && !meal.isVegetarian) {
    return { ok: false, tags, ingredients };
  }
  if (filters.veganOnly && !meal.isVegan) {
    return { ok: false, tags, ingredients };
  }
  if (filters.glutenFreeOnly && !meal.isGlutenFree) {
    return { ok: false, tags, ingredients };
  }
  if (filters.dairyFreeOnly && !meal.isDairyFree) {
    return { ok: false, tags, ingredients };
  }
  if (filters.nutFreeOnly && !meal.isNutFree) {
    return { ok: false, tags, ingredients };
  }

  if (
    disliked.length &&
    ingredients.some((ingredient) =>
      disliked.some((bad) =>
        ingredient.name.toLowerCase().includes(bad.toLowerCase()),
      ),
    )
  ) {
    return { ok: false, tags, ingredients };
  }

  const totalMinutes = meal.prepMinutes + meal.cookMinutes;
  if (!filters.noConstraints && filters.underTwentyMin && totalMinutes > 20) {
    return { ok: false, tags, ingredients };
  }
  if (!filters.noConstraints && filters.underThirtyMin && totalMinutes > 30) {
    return { ok: false, tags, ingredients };
  }
  if (!filters.noConstraints && filters.underFiveHundredKcal && meal.calories > 520) {
    return { ok: false, tags, ingredients };
  }
  if (!filters.noConstraints && filters.lowCarb && meal.carbs > 35) {
    return { ok: false, tags, ingredients };
  }
  if (!filters.noConstraints && filters.highFiber && meal.fibre < 8) {
    return { ok: false, tags, ingredients };
  }
  if (!filters.noConstraints && filters.budget && !tags.includes("budget")) {
    return { ok: false, tags, ingredients };
  }
  if (!filters.noConstraints && profile.cookingSkill === "beginner" && meal.difficulty === 3) {
    return { ok: false, tags, ingredients };
  }

  return { ok: true, tags, ingredients };
};

const scoreMeals = (
  meals: MealRecord[],
  input: MealEngineInput,
): MealMatch[] => {
  const cuisinePrefs = jsonArray<string[]>(input.profile.cuisinePrefs, []);
  const trainingDays = jsonArray<number[]>(input.profile.trainingDays, []);
  const todayIsTrainingDay = isTrainingDay(trainingDays);

  const scored: MealMatch[] = [];

  for (const meal of meals) {
    const tags = jsonArray<string[]>(meal.tags, []);
    const ingredients = jsonArray<{ name: string }[]>(meal.ingredients, []);
    const totalIngredients = ingredients.length;
    const fridgeMatches = ingredients.filter((ingredient) =>
      ingredientInFridge(ingredient.name, input.fridgeItems),
    ).length;

    const fridgePct =
      totalIngredients === 0 ? 0 : fridgeMatches / totalIngredients;

    if (!input.filters.noConstraints && input.filters.fridgeOnly && fridgePct < 0.5) {
      continue;
    }

    const fridgeScore = Math.round(fridgePct * 40);
    const computedTags = [...tags];
    if (fridgePct >= 0.85 && !computedTags.includes("in your fridge")) {
      computedTags.push("in your fridge");
    }

    const remainingCalories =
      input.profile.targetCalories - input.todayLog.calories;
    const remainingProtein =
      input.profile.targetProtein - input.todayLog.protein;

    if (!input.filters.noConstraints && remainingCalories < 300 && meal.calories > 400) {
      continue;
    }

    const hunger = clamp(input.hungerLevel, 1, 5);
    const hungerMultiplier = 0.15 + (hunger - 1) * 0.1;

    const idealCalories = remainingCalories * hungerMultiplier;
    const calorieDiff = Math.abs(meal.calories - idealCalories);
    const calorieScore =
      idealCalories <= 0
        ? 0
        : Math.max(0, 15 - (calorieDiff / idealCalories) * 15);

    const idealProtein = remainingProtein * hungerMultiplier;
    const proteinDiff = Math.abs(meal.protein - idealProtein);
    const proteinScore =
      idealProtein <= 0
        ? 0
        : Math.max(0, 15 - (proteinDiff / Math.max(idealProtein, 1)) * 15);

    const macroScore = Math.round(calorieScore + proteinScore);

    let contextScore = 0;
    if (todayIsTrainingDay && tags.includes("pre-workout")) {
      contextScore += 8;
    }
    if (todayIsTrainingDay && meal.protein >= 35) {
      contextScore += 4;
    }

    if (input.filters.highProtein && meal.protein >= 30) {
      contextScore += 5;
    }
    if (
      (input.filters.underTwentyMin || input.filters.underThirtyMin) &&
      meal.prepMinutes + meal.cookMinutes <=
        (input.filters.underTwentyMin ? 20 : 30)
    ) {
      contextScore += 3;
    }
    if (input.filters.lowCarb && meal.carbs <= 35) {
      contextScore += 3;
    }
    if (input.filters.highFiber && meal.fibre >= 8) {
      contextScore += 3;
    }

    if (cuisinePrefs.some((cuisine) => tags.includes(cuisine))) {
      contextScore += 4;
    }

    if ((input.todaysCategoryCount[meal.category] ?? 0) >= 2) {
      contextScore -= 5;
    }

    if (wasRecentlySwiped(input.swipes, meal.id)) {
      continue;
    }

    const totalScore = fridgeScore + macroScore + contextScore;
    const matchScore = clamp(Math.round(totalScore * (100 / 90)), 0, 100);

    scored.push({
      ...meal,
      matchScore,
      computedTags,
      fridgeScore,
      macroScore,
      contextScore,
    });
  }

  return scored.sort(
    (a, b) =>
      b.fridgeScore + b.macroScore + b.contextScore -
      (a.fridgeScore + a.macroScore + a.contextScore),
  );
};

export async function getRankedMeals(input: MealEngineInput): Promise<MealMatch[]> {
  const hardFiltered: MealRecord[] = [];

  for (const meal of input.meals) {
    const hard = passesHardFilters(meal, input.profile, input.filters);
    if (hard.ok) {
      hardFiltered.push(meal);
    }
  }

  if (hardFiltered.length < 2) {
    const remainingCalories =
      input.profile.targetCalories - input.todayLog.calories;
    const remainingProtein =
      input.profile.targetProtein - input.todayLog.protein;
    const remainingCarbs = input.profile.targetCarbs - input.todayLog.carbs;
    const remainingFat = input.profile.targetFat - input.todayLog.fat;

    const fallbackMeals = await generateFallbackMeals({
      remainingCalories,
      remainingProtein,
      remainingCarbs,
      remainingFat,
      fridgeItems: input.fridgeItems.map((item) => item.name),
      dietaryFilters: jsonArray<string[]>(input.profile.dietaryFilters, []),
      dislikedIngredients: jsonArray<string[]>(
        input.profile.dislikedIngredients,
        [],
      ),
      filters: input.filters,
      hungerLevel: input.hungerLevel,
      count: 3,
    });

    const created = await Promise.all(
      fallbackMeals.map((meal) =>
        prisma.meal.create({
          data: buildMealRecordFromGenerated(meal),
        }),
      ),
    );

    return scoreMeals(created, input).slice(0, input.limit ?? 5);
  }

  return scoreMeals(hardFiltered, input).slice(0, input.limit ?? 5);
}
