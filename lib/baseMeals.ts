import type { PrismaClient } from "@prisma/client";

type BaseMeal = {
  name: string;
  legacyNames?: string[];
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
  satiating: number;
  prepMinutes: number;
  cookMinutes: number;
  difficulty: number;
  tags: string[];
  ingredients: Array<{ name: string; amount: string; category: string }>;
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

export const baseMeals: BaseMeal[] = [
  {
    name: "Smoky Potato, Sausage & Scrambled Eggs Bowl",
    legacyNames: ["Smoky Potato, Sausage and Scrambled Eggs Bowl"],
    description:
      "High-protein smoky potato hash with sausages and soft scrambled eggs",
    emoji: "\u{1F373}",
    photoPath: "/uploads/meals/smoky-potato-sausage-eggs.jpg",
    category: "breakfast",
    colorTheme: "amber",
    calories: 610,
    protein: 33,
    carbs: 52,
    fat: 30,
    fibre: 5,
    satiating: 4,
    prepMinutes: 5,
    cookMinutes: 18,
    difficulty: 1,
    tags: ["high protein", "quick", "budget", "breakfast"],
    ingredients: [
      { name: "Potatoes", amount: "250g", category: "carb" },
      { name: "Smoked sausages", amount: "100g", category: "protein" },
      { name: "Eggs", amount: "3 large", category: "protein" },
      { name: "Egg whites (optional)", amount: "50g", category: "protein" },
      { name: "Paprika", amount: "1 tsp", category: "seasoning" },
      { name: "Salt and pepper", amount: "to taste", category: "seasoning" },
      { name: "Cooking spray", amount: "1 tsp", category: "other" },
    ],
    steps: [
      "Dice the potatoes and season with paprika, salt, and pepper.",
      "Pan-fry the potatoes until golden and tender, 10 to 12 minutes.",
      "Add sliced sausage and cook until browned and warmed through.",
      "Scramble the eggs in the pan until just set and creamy.",
      "Combine everything and serve hot.",
    ],
    tools: ["Non-stick skillet", "Spatula", "Knife"],
    allergens: ["eggs"],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isDairyFree: true,
    isHalal: false,
    isKosher: false,
    isNutFree: true,
  },
  {
    name: "Simple Beef Rigatoni",
    legacyNames: [],
    description: "Classic beef pasta with rich, simple sauce",
    emoji: "\u{1F35D}",
    photoPath: "/uploads/meals/simple-beef-rigatoni.jpeg",
    category: "protein",
    colorTheme: "coral",
    calories: 615,
    protein: 32,
    carbs: 70,
    fat: 23,
    fibre: 5,
    satiating: 4,
    prepMinutes: 5,
    cookMinutes: 18,
    difficulty: 1,
    tags: ["high protein", "quick", "budget"],
    ingredients: [
      { name: "Rigatoni pasta", amount: "90g dry", category: "carb" },
      { name: "Minced beef", amount: "110g", category: "protein" },
      { name: "Tomato sauce", amount: "100g", category: "veg" },
      { name: "Onion", amount: "30g", category: "veg" },
      { name: "Garlic", amount: "1 clove", category: "seasoning" },
      { name: "Olive oil", amount: "1 tsp", category: "other" },
      { name: "Salt and pepper", amount: "to taste", category: "seasoning" },
    ],
    steps: [
      "Boil rigatoni until al dente and reserve a splash of pasta water.",
      "Saute onion and garlic in a little oil, then brown the minced beef.",
      "Stir in tomato sauce and simmer for 5 to 7 minutes.",
      "Toss pasta with the beef sauce and adjust seasoning.",
    ],
    tools: ["Pot", "Skillet", "Wooden spoon"],
    allergens: ["gluten"],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isDairyFree: true,
    isHalal: false,
    isKosher: false,
    isNutFree: true,
  },
];

let baseMealsEnsured = false;

export async function ensureBaseMeals(prisma: PrismaClient) {
  if (baseMealsEnsured) return;

  for (const meal of baseMeals) {
    const existing = await prisma.meal.findFirst({
      where: { name: { in: [meal.name, ...(meal.legacyNames ?? [])] } },
      select: { id: true },
    });

    const data = {
      name: meal.name,
      description: meal.description,
      emoji: meal.emoji,
      photoPath: meal.photoPath,
      photoPaths: JSON.stringify(meal.photoPath ? [meal.photoPath] : []),
      category: meal.category,
      colorTheme: meal.colorTheme,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      fibre: meal.fibre,
      satiating: meal.satiating,
      prepMinutes: meal.prepMinutes,
      cookMinutes: meal.cookMinutes,
      difficulty: meal.difficulty,
      tags: JSON.stringify(meal.tags),
      ingredients: JSON.stringify(meal.ingredients),
      steps: JSON.stringify(meal.steps),
      tools: JSON.stringify(meal.tools),
      allergens: JSON.stringify(meal.allergens),
      isVegetarian: meal.isVegetarian,
      isVegan: meal.isVegan,
      isGlutenFree: meal.isGlutenFree,
      isDairyFree: meal.isDairyFree,
      isHalal: meal.isHalal,
      isKosher: meal.isKosher,
      isNutFree: meal.isNutFree,
      isSeeded: true,
      createdBy: null,
    };

    if (existing) {
      await prisma.meal.update({ where: { id: existing.id }, data });
    } else {
      await prisma.meal.create({ data });
    }
  }

  baseMealsEnsured = true;
}
