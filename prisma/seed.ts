import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const mealName = "Smoky Potato, Sausage and Scrambled Eggs Bowl";

  const existing = await prisma.meal.findFirst({
    where: { name: mealName },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  await prisma.meal.create({
    data: {
      name: mealName,
      description:
        "High-protein smoky potato hash with sausages and soft scrambled eggs",
      emoji: "\u{1F373}",
      photoPath: null,
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
      tags: JSON.stringify(["high protein", "quick", "budget", "breakfast"]),
      ingredients: JSON.stringify([
        { name: "Potatoes", amount: "250g", category: "carb" },
        { name: "Smoked sausages", amount: "100g", category: "protein" },
        { name: "Eggs", amount: "3 large", category: "protein" },
        { name: "Egg whites (optional)", amount: "50g", category: "protein" },
        { name: "Paprika", amount: "1 tsp", category: "seasoning" },
        { name: "Salt and pepper", amount: "to taste", category: "seasoning" },
        { name: "Cooking spray", amount: "1 tsp", category: "other" },
      ]),
      steps: JSON.stringify([
        "Dice the potatoes and season with paprika, salt, and pepper.",
        "Pan-fry the potatoes until golden and tender, 10 to 12 minutes.",
        "Add sliced sausage and cook until browned and warmed through.",
        "Scramble the eggs in the pan until just set and creamy.",
        "Combine everything and serve hot.",
      ]),
      tools: JSON.stringify(["Non-stick skillet", "Spatula", "Knife"]),
      allergens: JSON.stringify(["eggs"]),
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isDairyFree: true,
      isHalal: false,
      isKosher: false,
      isNutFree: true,
      isSeeded: true,
      createdBy: null,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
