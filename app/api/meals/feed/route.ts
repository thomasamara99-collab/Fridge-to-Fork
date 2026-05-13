import { NextResponse } from "next/server";

import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { getRankedMeals } from "../../../../lib/mealEngine";
import { ensureBaseMeals } from "../../../../lib/baseMeals";
import { ensureThemealDbMeals } from "../../../../lib/themealdb";
import type { ActiveFilters } from "../../../../types";

const parseFilters = (raw: string | null): ActiveFilters => {
  if (!raw) {
    return {
      noConstraints: false,
      fridgeOnly: false,
      underTwentyMin: false,
      underThirtyMin: false,
      highProtein: false,
      preWorkout: false,
      budget: false,
      underFiveHundredKcal: false,
      vegetarianOnly: false,
      veganOnly: false,
      glutenFreeOnly: false,
      dairyFreeOnly: false,
      nutFreeOnly: false,
      lowCarb: false,
      highFiber: false,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ActiveFilters>;
    return {
      noConstraints: Boolean(parsed.noConstraints),
      fridgeOnly: Boolean(parsed.fridgeOnly),
      underTwentyMin: Boolean(parsed.underTwentyMin),
      underThirtyMin: Boolean(parsed.underThirtyMin),
      highProtein: Boolean(parsed.highProtein),
      preWorkout: Boolean(parsed.preWorkout),
      budget: Boolean(parsed.budget),
      underFiveHundredKcal: Boolean(parsed.underFiveHundredKcal),
      vegetarianOnly: Boolean(parsed.vegetarianOnly),
      veganOnly: Boolean(parsed.veganOnly),
      glutenFreeOnly: Boolean(parsed.glutenFreeOnly),
      dairyFreeOnly: Boolean(parsed.dairyFreeOnly),
      nutFreeOnly: Boolean(parsed.nutFreeOnly),
      lowCarb: Boolean(parsed.lowCarb),
      highFiber: Boolean(parsed.highFiber),
    };
  } catch {
    return {
      noConstraints: false,
      fridgeOnly: false,
      underTwentyMin: false,
      underThirtyMin: false,
      highProtein: false,
      preWorkout: false,
      budget: false,
      underFiveHundredKcal: false,
      vegetarianOnly: false,
      veganOnly: false,
      glutenFreeOnly: false,
      dairyFreeOnly: false,
      nutFreeOnly: false,
      lowCarb: false,
      highFiber: false,
    };
  }
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  let filters = parseFilters(searchParams.get("filters"));
  const hungerLevel = Number(searchParams.get("hunger") ?? "3");
  const limit = Number(searchParams.get("limit") ?? "12");
  const excludedMealIds = (searchParams.get("excludeMealIds") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  await ensureBaseMeals(prisma);
  void ensureThemealDbMeals(prisma, { minimumCount: 36, batchSize: 10 }).catch(
    () => undefined,
  );

  const [profile, fridgeItems, mealsRaw] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.fridgeItem.findMany({ where: { userId: session.user.id } }),
    prisma.meal.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        emoji: true,
        photoPath: true,
        category: true,
        colorTheme: true,
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        fibre: true,
        prepMinutes: true,
        cookMinutes: true,
        difficulty: true,
        tags: true,
        ingredients: true,
        steps: true,
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: true,
        isDairyFree: true,
        isHalal: true,
        isKosher: true,
        isNutFree: true,
      },
    }),
  ]);

  const meals = mealsRaw.map((meal) => ({
    ...meal,
    photoPaths: meal.photoPath ? JSON.stringify([meal.photoPath]) : "[]",
    satiating: 3,
    tools: "[]",
    allergens: "[]",
  }));

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const todayLog =
    (await prisma.dailyLog.findFirst({
      where: {
        userId: session.user.id,
        date: { gte: startOfDay, lte: endOfDay },
      },
    })) ?? {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const swipes = await prisma.swipe.findMany({
    where: { userId: session.user.id, swipedAt: { gte: sevenDaysAgo } },
    include: { meal: { select: { category: true } } },
  });

  const todaysCategoryCount = swipes.reduce<Record<string, number>>(
    (acc, swipe) => {
      if (isSameDay(swipe.swipedAt, now)) {
        acc[swipe.meal.category] = (acc[swipe.meal.category] ?? 0) + 1;
      }
      return acc;
    },
    {},
  );

  const optionalFilterKeys: Array<keyof ActiveFilters> = [
    "underTwentyMin",
    "underThirtyMin",
    "highProtein",
    "preWorkout",
    "budget",
    "underFiveHundredKcal",
    "vegetarianOnly",
    "veganOnly",
    "glutenFreeOnly",
    "dairyFreeOnly",
    "nutFreeOnly",
    "lowCarb",
    "highFiber",
  ];

  const hasOptionalFilters = optionalFilterKeys.some((key) => filters[key]);
  if (filters.fridgeOnly && fridgeItems.length === 0 && !hasOptionalFilters) {
    filters = { ...filters, fridgeOnly: false, noConstraints: true };
  }

  let ranked = await getRankedMeals({
    meals,
    profile,
    fridgeItems,
    todayLog,
    filters,
    hungerLevel,
    swipes: swipes.map((swipe) => ({
      mealId: swipe.mealId,
      direction: swipe.direction as "left" | "right" | "cooked",
      swipedAt: swipe.swipedAt,
    })),
    todaysCategoryCount,
    excludedMealIds,
    limit,
  });

  if (!ranked.length && !filters.noConstraints) {
    ranked = await getRankedMeals({
      meals,
      profile,
      fridgeItems,
      todayLog,
      filters: { ...filters, noConstraints: true, fridgeOnly: false },
      hungerLevel,
      swipes: swipes.map((swipe) => ({
        mealId: swipe.mealId,
        direction: swipe.direction as "left" | "right" | "cooked",
        swipedAt: swipe.swipedAt,
      })),
      todaysCategoryCount,
      excludedMealIds,
      limit,
    });
  }

  if (ranked.length < Math.min(limit, 6)) {
    const supplemental = await getRankedMeals({
      meals,
      profile,
      fridgeItems,
      todayLog,
      filters: {
        ...filters,
        noConstraints: true,
        fridgeOnly: false,
      },
      hungerLevel,
      swipes: [],
      todaysCategoryCount: {},
      excludedMealIds: [
        ...excludedMealIds,
        ...ranked.map((meal) => meal.id),
      ],
      limit: limit - ranked.length,
    });

    const existingIds = new Set(ranked.map((meal) => meal.id));
    for (const meal of supplemental) {
      if (!existingIds.has(meal.id)) {
        ranked.push(meal);
      }
    }
  }

  const payload = ranked.map((meal) => ({
    ...meal,
    tags: JSON.parse(meal.tags),
    ingredients: JSON.parse(meal.ingredients),
    steps: JSON.parse(meal.steps),
    tools: JSON.parse(meal.tools),
    allergens: JSON.parse(meal.allergens),
    photoPaths: JSON.parse(meal.photoPaths),
  }));

  return NextResponse.json(payload);
}
