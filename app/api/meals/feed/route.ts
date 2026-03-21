import { NextResponse } from "next/server";

import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { getRankedMeals } from "../../../../lib/mealEngine";
import type { ActiveFilters } from "../../../../types";

const parseFilters = (raw: string | null): ActiveFilters => {
  if (!raw) {
    return {
      fridgeOnly: false,
      underTwentyMin: false,
      highProtein: false,
      preWorkout: false,
      budget: false,
      underFiveHundredKcal: false,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ActiveFilters>;
    return {
      fridgeOnly: Boolean(parsed.fridgeOnly),
      underTwentyMin: Boolean(parsed.underTwentyMin),
      highProtein: Boolean(parsed.highProtein),
      preWorkout: Boolean(parsed.preWorkout),
      budget: Boolean(parsed.budget),
      underFiveHundredKcal: Boolean(parsed.underFiveHundredKcal),
    };
  } catch {
    return {
      fridgeOnly: false,
      underTwentyMin: false,
      highProtein: false,
      preWorkout: false,
      budget: false,
      underFiveHundredKcal: false,
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
  const filters = parseFilters(searchParams.get("filters"));
  const hungerLevel = Number(searchParams.get("hunger") ?? "3");
  const limit = Number(searchParams.get("limit") ?? "5");

  const [profile, fridgeItems, meals] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.fridgeItem.findMany({ where: { userId: session.user.id } }),
    prisma.meal.findMany(),
  ]);

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

  const ranked = await getRankedMeals({
    meals,
    profile,
    fridgeItems,
    todayLog,
    filters,
    hungerLevel,
    swipes: swipes.map((swipe) => ({
      mealId: swipe.mealId,
      direction: swipe.direction as "left" | "right",
      swipedAt: swipe.swipedAt,
    })),
    todaysCategoryCount,
    limit,
  });

  const payload = ranked.map((meal) => ({
    ...meal,
    tags: JSON.parse(meal.tags),
    ingredients: JSON.parse(meal.ingredients),
    steps: JSON.parse(meal.steps),
  }));

  return NextResponse.json(payload);
}
