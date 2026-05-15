import type { PrismaClient } from "@prisma/client";

import type { MealData } from "../types";
import { macroCalories } from "./nutrition";

type ThemealDbMeal = {
  idMeal: string;
  strMeal: string;
  strCategory: string | null;
  strArea: string | null;
  strInstructions: string | null;
  strMealThumb: string | null;
  strTags: string | null;
} & {
  [K in `strIngredient${number}`]: string | null;
} & {
  [K in `strMeasure${number}`]: string | null;
};

type ThemealDbResponse = {
  meals: ThemealDbMeal[] | null;
};

const API_KEY = process.env.THEMEALDB_API_KEY ?? "1";
const API_BASE_URL = process.env.THEMEALDB_API_BASE_URL
  ? process.env.THEMEALDB_API_BASE_URL.replace(/\/$/, "")
  : `https://www.themealdb.com/api/json/v1/${API_KEY}`;

const THEMEALDB_TAG_PREFIX = "source:themealdb:";

const PROTEIN_KEYWORDS = [
  "chicken",
  "beef",
  "lamb",
  "pork",
  "turkey",
  "sausage",
  "ham",
  "bacon",
  "fish",
  "salmon",
  "tuna",
  "prawn",
  "shrimp",
  "egg",
  "tofu",
  "lentil",
  "bean",
  "chickpea",
  "quorn",
];

const GLUTEN_KEYWORDS = [
  "flour",
  "pasta",
  "spaghetti",
  "rigatoni",
  "noodle",
  "bread",
  "breadcrumbs",
  "wrap",
  "tortilla",
  "soy sauce",
];

const DAIRY_KEYWORDS = [
  "milk",
  "cream",
  "cheese",
  "butter",
  "yogurt",
  "yoghurt",
  "feta",
  "mozzarella",
  "parmesan",
];

const MEAT_KEYWORDS = [
  "chicken",
  "beef",
  "lamb",
  "pork",
  "ham",
  "bacon",
  "sausage",
  "turkey",
  "duck",
  "goat",
  "veal",
  "fish",
  "salmon",
  "tuna",
  "cod",
  "prawn",
  "shrimp",
  "anchovy",
  "oyster",
  "clam",
  "mussel",
  "crab",
];

const VEGAN_BLOCKERS = [
  ...MEAT_KEYWORDS,
  ...DAIRY_KEYWORDS,
  "egg",
  "honey",
  "gelatin",
];

const NUT_KEYWORDS = [
  "almond",
  "cashew",
  "hazelnut",
  "peanut",
  "pistachio",
  "walnut",
  "pecan",
  "macadamia",
  "nut",
];

let syncInProgress: Promise<void> | null = null;
let lastSyncAt = 0;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseIngredients(meal: ThemealDbMeal): MealData["ingredients"] {
  const items: MealData["ingredients"] = [];

  for (let index = 1; index <= 20; index += 1) {
    const ingredientKey = `strIngredient${index}` as const;
    const measureKey = `strMeasure${index}` as const;

    const ingredient = meal[ingredientKey]?.trim();
    const measure = meal[measureKey]?.trim();
    if (!ingredient) continue;

    items.push({
      name: ingredient,
      amount: measure && measure.length > 0 ? measure : "to taste",
      category: classifyIngredientCategory(ingredient),
    });
  }

  return items;
}

function parseSteps(instructions: string | null): string[] {
  if (!instructions) {
    return [
      "Prep your ingredients and season to taste.",
      "Cook until done and serve warm.",
    ];
  }

  const cleaned = instructions
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => line.split(/\.\s+/))
    .map((line) => line.trim())
    .filter((line) => line.length > 8)
    .slice(0, 8);

  return cleaned.length > 0 ? cleaned : ["Cook according to the original recipe."];
}

function classifyIngredientCategory(ingredientName: string): string {
  const lower = normalizeLabel(ingredientName);

  if (PROTEIN_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return "protein";
  }
  if (
    ["rice", "pasta", "potato", "bread", "oat", "noodle", "quinoa"].some(
      (keyword) => lower.includes(keyword),
    )
  ) {
    return "carb";
  }
  if (
    ["salt", "pepper", "paprika", "cumin", "coriander", "oregano", "spice"].some(
      (keyword) => lower.includes(keyword),
    )
  ) {
    return "seasoning";
  }
  if (
    ["oil", "butter", "ghee", "mayo", "mayonnaise"].some((keyword) =>
      lower.includes(keyword),
    )
  ) {
    return "fat";
  }
  return "veg";
}

function mapCategory(category: string | null): MealData["category"] {
  const value = normalizeLabel(category ?? "");

  if (value.includes("breakfast")) return "breakfast";
  if (["beef", "chicken", "lamb", "pork", "goat", "seafood"].includes(value)) {
    return "protein";
  }
  if (["vegan", "vegetarian", "side", "starter"].includes(value)) return "veggie";
  if (["pasta", "rice", "miscellaneous"].includes(value)) return "carbs";
  if (["dessert", "snack"].includes(value)) return "snack";

  return "light";
}

function mapColorTheme(category: MealData["category"]): MealData["colorTheme"] {
  const map: Record<MealData["category"], MealData["colorTheme"]> = {
    breakfast: "amber",
    protein: "coral",
    veggie: "green",
    carbs: "teal",
    light: "blue",
    snack: "amber",
  };

  return map[category];
}

function estimateMacros(
  category: MealData["category"],
  ingredients: MealData["ingredients"],
): Pick<MealData, "calories" | "protein" | "carbs" | "fat" | "fibre"> {
  const lowerIngredients = ingredients.map((ingredient) =>
    normalizeLabel(ingredient.name),
  );

  const proteinHits = lowerIngredients.filter((name) =>
    PROTEIN_KEYWORDS.some((keyword) => name.includes(keyword)),
  ).length;

  const carbHits = lowerIngredients.filter((name) =>
    ["rice", "pasta", "noodle", "potato", "bread", "oat", "tortilla"].some(
      (keyword) => name.includes(keyword),
    ),
  ).length;

  const fibreHits = lowerIngredients.filter((name) =>
    ["bean", "lentil", "broccoli", "spinach", "kale", "pea", "carrot", "cabbage"].some(
      (keyword) => name.includes(keyword),
    ),
  ).length;

  let protein = 20 + proteinHits * 6;
  let carbs = 24 + carbHits * 11;
  let fat = 12 + Math.max(0, proteinHits - 1) * 3;

  if (category === "breakfast") {
    protein += 3;
    carbs += 8;
  }
  if (category === "veggie") {
    protein -= 5;
    carbs += 6;
    fat -= 2;
  }
  if (category === "snack") {
    carbs -= 8;
    fat += 2;
  }

  protein = clamp(protein, 12, 52);
  carbs = clamp(carbs, 12, 88);
  fat = clamp(fat, 8, 36);

  let calories = macroCalories(protein, carbs, fat);
  const fibre = clamp(3 + fibreHits * 2, 2, 14);

  if (calories < 320) {
    const deficit = 320 - calories;
    carbs += Math.round(deficit / 8);
    calories = macroCalories(protein, carbs, fat);
  }

  if (calories > 780) {
    const overflow = calories - 780;
    carbs = clamp(carbs - Math.round(overflow / 9), 12, carbs);
    calories = macroCalories(protein, carbs, fat);
  }

  return {
    calories,
    protein,
    carbs,
    fat,
    fibre,
  };
}

function inferDietFlags(ingredients: MealData["ingredients"]): Pick<
  MealData,
  | "isVegetarian"
  | "isVegan"
  | "isGlutenFree"
  | "isDairyFree"
  | "isHalal"
  | "isKosher"
  | "isNutFree"
> {
  const values = ingredients.map((item) => normalizeLabel(item.name));

  const hasMeat = values.some((value) =>
    MEAT_KEYWORDS.some((keyword) => value.includes(keyword)),
  );
  const hasVeganBlocker = values.some((value) =>
    VEGAN_BLOCKERS.some((keyword) => value.includes(keyword)),
  );
  const hasGluten = values.some((value) =>
    GLUTEN_KEYWORDS.some((keyword) => value.includes(keyword)),
  );
  const hasDairy = values.some((value) =>
    DAIRY_KEYWORDS.some((keyword) => value.includes(keyword)),
  );
  const hasNuts = values.some((value) =>
    NUT_KEYWORDS.some((keyword) => value.includes(keyword)),
  );

  const isVegetarian = !hasMeat;
  const isVegan = !hasVeganBlocker;

  return {
    isVegetarian,
    isVegan,
    isGlutenFree: !hasGluten,
    isDairyFree: !hasDairy,
    isHalal: !values.some((value) => value.includes("pork") || value.includes("bacon")),
    isKosher: !values.some(
      (value) =>
        value.includes("pork") || value.includes("shellfish") || value.includes("shrimp"),
    ),
    isNutFree: !hasNuts,
  };
}

function inferDifficulty(ingredients: MealData["ingredients"], steps: string[]): 1 | 2 | 3 {
  if (steps.length >= 6 || ingredients.length >= 11) return 3;
  if (steps.length >= 4 || ingredients.length >= 7) return 2;
  return 1;
}

function inferTimes(ingredients: MealData["ingredients"], steps: string[]) {
  const prepMinutes = clamp(4 + Math.round(ingredients.length * 1.2), 5, 20);
  const cookMinutes = clamp(8 + steps.length * 4, 10, 45);

  return { prepMinutes, cookMinutes };
}

function inferTags(meal: ThemealDbMeal, category: MealData["category"], protein: number): string[] {
  const categoryTag = category === "protein" ? "high protein" : category;
  const areaTag = meal.strArea ? normalizeLabel(meal.strArea) : "global";
  const apiTags = (meal.strTags ?? "")
    .split(",")
    .map((tag) => normalizeLabel(tag))
    .filter(Boolean)
    .slice(0, 3);

  const tags = new Set<string>([
    "themealdb",
    "community",
    categoryTag,
    areaTag,
    ...apiTags,
  ]);

  if (protein >= 30) tags.add("high protein");

  return Array.from(tags);
}

function normalizeMeal(meal: ThemealDbMeal): MealData {
  const ingredients = parseIngredients(meal);
  const steps = parseSteps(meal.strInstructions);
  const category = mapCategory(meal.strCategory);
  const times = inferTimes(ingredients, steps);
  const macros = estimateMacros(category, ingredients);
  const dietFlags = inferDietFlags(ingredients);

  const tags = inferTags(meal, category, macros.protein);
  tags.push(`${THEMEALDB_TAG_PREFIX}${meal.idMeal}`);

  const tools = ["Knife", "Pan", "Pot"].slice(0, inferDifficulty(ingredients, steps));

  return {
    name: meal.strMeal.trim(),
    description: `Imported from TheMealDB (${meal.strArea ?? "Global"})`,
    emoji: category === "breakfast" ? "??" : category === "veggie" ? "??" : "???",
    photoPath: meal.strMealThumb,
    photoPaths: meal.strMealThumb ? [meal.strMealThumb] : [],
    category,
    colorTheme: mapColorTheme(category),
    calories: macros.calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
    fibre: macros.fibre,
    satiating: clamp(Math.round((macros.protein + macros.fibre) / 12), 2, 5),
    prepMinutes: times.prepMinutes,
    cookMinutes: times.cookMinutes,
    difficulty: inferDifficulty(ingredients, steps),
    tags,
    ingredients,
    steps,
    tools,
    allergens: [
      dietFlags.isGlutenFree ? null : "gluten",
      dietFlags.isDairyFree ? null : "dairy",
      dietFlags.isNutFree ? null : "nuts",
    ].filter((value): value is string => Boolean(value)),
    ...dietFlags,
  };
}

async function fetchRandomMeal(): Promise<ThemealDbMeal | null> {
  const response = await fetch(`${API_BASE_URL}/random.php`, {
    method: "GET",
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as ThemealDbResponse;
  return payload.meals?.[0] ?? null;
}

export async function ensureThemealDbMeals(
  prisma: PrismaClient,
  options?: { minimumCount?: number; batchSize?: number; force?: boolean },
) {
  const minimumCount = options?.minimumCount ?? 150;
  const batchSize = options?.batchSize ?? 20;
  const force = options?.force ?? false;

  const now = Date.now();
  const existingCount = await prisma.meal.count({
    where: {
      isSeeded: true,
      tags: { contains: "themealdb" },
    },
  });

  if (!force) {
    if (existingCount >= minimumCount) return;
    if (syncInProgress) {
      await syncInProgress;
      return;
    }
    if (now - lastSyncAt < 5 * 60 * 1000) return;
  }

  syncInProgress = (async () => {
    const seen = new Set<string>();
    const required = force ? batchSize : Math.max(minimumCount - existingCount, 0);
    const target = Math.max(required, batchSize);
    const maxAttempts = target * 4;
    let inserted = 0;

    for (let attempt = 0; attempt < maxAttempts && inserted < target; attempt += 1) {
      let remoteMeal: ThemealDbMeal | null = null;
      try {
        remoteMeal = await fetchRandomMeal();
      } catch {
        continue;
      }

      if (!remoteMeal || seen.has(remoteMeal.idMeal)) continue;
      seen.add(remoteMeal.idMeal);

      const sourceTag = `${THEMEALDB_TAG_PREFIX}${remoteMeal.idMeal}`;
      const exists = await prisma.meal.findFirst({
        where: {
          OR: [
            { tags: { contains: sourceTag } },
            { isSeeded: true, name: remoteMeal.strMeal.trim() },
          ],
        },
        select: { id: true },
      });

      const normalized = normalizeMeal(remoteMeal);
      const data = {
        name: normalized.name,
        description: normalized.description,
        emoji: normalized.emoji,
        photoPath: normalized.photoPath ?? null,
        category: normalized.category,
        colorTheme: normalized.colorTheme,
        calories: normalized.calories,
        protein: normalized.protein,
        carbs: normalized.carbs,
        fat: normalized.fat,
        fibre: normalized.fibre,
        prepMinutes: normalized.prepMinutes,
        cookMinutes: normalized.cookMinutes,
        difficulty: normalized.difficulty,
        tags: JSON.stringify(normalized.tags),
        ingredients: JSON.stringify(normalized.ingredients),
        steps: JSON.stringify(normalized.steps),
        isVegetarian: normalized.isVegetarian,
        isVegan: normalized.isVegan,
        isGlutenFree: normalized.isGlutenFree,
        isDairyFree: normalized.isDairyFree,
        isHalal: normalized.isHalal,
        isKosher: normalized.isKosher,
        isNutFree: normalized.isNutFree,
        isSeeded: true,
        createdBy: null,
      };

      if (exists) {
        await prisma.meal.update({ where: { id: exists.id }, data });
      } else {
        await prisma.meal.create({ data });
        inserted += 1;
      }
    }

    lastSyncAt = Date.now();
  })();

  try {
    await syncInProgress;
  } finally {
    syncInProgress = null;
  }
}
