import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import type { ActiveFilters, MealData } from "../types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const mealSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  emoji: z.string().min(1),
  category: z.enum(["breakfast", "protein", "veggie", "carbs", "light", "snack"]),
  colorTheme: z.enum(["amber", "coral", "green", "teal", "blue"]),
  calories: z.number().int().min(50),
  protein: z.number().int().min(0),
  carbs: z.number().int().min(0),
  fat: z.number().int().min(0),
  fibre: z.number().int().min(0),
  prepMinutes: z.number().int().min(0),
  cookMinutes: z.number().int().min(0),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  tags: z.array(z.string()),
  ingredients: z.array(
    z.object({
      name: z.string(),
      amount: z.string(),
      category: z.string(),
    }),
  ),
  steps: z.array(z.string()).min(1),
  isVegetarian: z.boolean(),
  isVegan: z.boolean(),
  isGlutenFree: z.boolean(),
  isDairyFree: z.boolean(),
  isHalal: z.boolean(),
  isKosher: z.boolean(),
  isNutFree: z.boolean(),
});

const responseSchema = z.array(mealSchema);

const emergencyMeal: MealData = {
  name: "Lemon herb chicken bowl",
  description: "Simple chicken with rice and lemony greens",
  emoji: "🍋",
  category: "protein",
  colorTheme: "coral",
  calories: 430,
  protein: 35,
  carbs: 45,
  fat: 12,
  fibre: 4,
  prepMinutes: 8,
  cookMinutes: 12,
  difficulty: 1,
  tags: ["high protein", "quick"],
  ingredients: [
    { name: "Chicken breast", amount: "140g", category: "protein" },
    { name: "Cooked rice", amount: "1 cup", category: "carb" },
    { name: "Baby spinach", amount: "1 cup", category: "veg" },
    { name: "Lemon", amount: "1/2", category: "fruit" },
  ],
  steps: [
    "Cook rice until fluffy.",
    "Sear chicken until cooked through.",
    "Toss spinach with lemon and serve with chicken over rice.",
  ],
  isVegetarian: false,
  isVegan: false,
  isGlutenFree: true,
  isDairyFree: true,
  isHalal: true,
  isKosher: false,
  isNutFree: true,
};

const systemPrompt =
  "You are a precision nutrition chef. Generate meal suggestions as valid JSON only. " +
  "No commentary, no markdown, no text outside the JSON array. " +
  "All macro values must be consistent: protein×4 + carbs×4 + fat×9 must equal " +
  "calories within ±15. Return only a JSON array.";

const buildUserPrompt = (context: {
  remainingCalories: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFat: number;
  fridgeItems: string[];
  dietaryFilters: string[];
  dislikedIngredients: string[];
  filters: ActiveFilters;
  hungerLevel: number;
  count: number;
}) => `Generate ${context.count} meal suggestions. Return ONLY a valid JSON array.

Remaining macros today:
  Calories: ${context.remainingCalories} kcal
  Protein:  ${context.remainingProtein}g
  Carbs:    ${context.remainingCarbs}g
  Fat:      ${context.remainingFat}g

Hunger level: ${context.hungerLevel}/5
Dietary restrictions: ${JSON.stringify(context.dietaryFilters)}
Disliked ingredients: ${JSON.stringify(context.dislikedIngredients)}
Available ingredients: ${JSON.stringify(context.fridgeItems)}
Active filters: ${JSON.stringify(context.filters)}

Return this exact structure per meal:
[{
  "name": "...",
  "description": "...",
  "emoji": "...",
  "category": "breakfast|protein|veggie|carbs|light|snack",
  "colorTheme": "amber|coral|green|teal|blue",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "fibre": 0,
  "prepMinutes": 0,
  "cookMinutes": 0,
  "difficulty": 1,
  "tags": [],
  "ingredients": [{"name":"","amount":"","category":""}],
  "steps": [],
  "isVegetarian": false,
  "isVegan": false,
  "isGlutenFree": false,
  "isDairyFree": false,
  "isHalal": false,
  "isKosher": false,
  "isNutFree": false
}]`;

function parseMeals(text: string): MealData[] | null {
  try {
    const parsed = JSON.parse(text);
    return responseSchema.parse(parsed);
  } catch {
    return null;
  }
}

async function requestMeals(prompt: string, model: string): Promise<MealData[] | null> {
  const message = await client.messages.create({
    model,
    max_tokens: 1400,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((part) => part.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  const parsed = parseMeals(textBlock.text.trim());
  return parsed;
}

export async function generateFallbackMeals(context: {
  remainingCalories: number;
  remainingProtein: number;
  remainingCarbs: number;
  remainingFat: number;
  fridgeItems: string[];
  dietaryFilters: string[];
  dislikedIngredients: string[];
  filters: ActiveFilters;
  hungerLevel: number;
  count: number;
}): Promise<MealData[]> {
  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest";
  const prompt = buildUserPrompt(context);

  const firstAttempt = await requestMeals(prompt, model);
  if (firstAttempt) return firstAttempt;

  const secondAttempt = await requestMeals(
    `${prompt}\n\nReturn ONLY JSON. No extra text.`,
    model,
  );

  return secondAttempt ?? [emergencyMeal];
}
