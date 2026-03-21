import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

const logSchema = z.object({
  mealId: z.string().optional(),
  mealName: z.string().optional(),
  calories: z.number().int().min(0).optional(),
  protein: z.number().int().min(0).optional(),
  carbs: z.number().int().min(0).optional(),
  fat: z.number().int().min(0).optional(),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = logSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { mealId } = parsed.data;
  const meal =
    mealId ?
      await prisma.meal.findUnique({ where: { id: mealId } }) :
      null;

  const mealName =
    meal?.name ?? parsed.data.mealName ?? "Custom meal";
  const calories = meal?.calories ?? parsed.data.calories ?? 0;
  const protein = meal?.protein ?? parsed.data.protein ?? 0;
  const carbs = meal?.carbs ?? parsed.data.carbs ?? 0;
  const fat = meal?.fat ?? parsed.data.fat ?? 0;

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const existingLog = await prisma.dailyLog.findFirst({
    where: {
      userId: session.user.id,
      date: { gte: startOfDay, lte: endOfDay },
    },
  });

  const log =
    existingLog ??
    (await prisma.dailyLog.create({
      data: { userId: session.user.id },
    }));

  await prisma.$transaction([
    prisma.loggedMeal.create({
      data: {
        logId: log.id,
        mealId: meal?.id ?? null,
        mealName,
        calories,
        protein,
        carbs,
        fat,
      },
    }),
    prisma.dailyLog.update({
      where: { id: log.id },
      data: {
        calories: { increment: calories },
        protein: { increment: protein },
        carbs: { increment: carbs },
        fat: { increment: fat },
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
