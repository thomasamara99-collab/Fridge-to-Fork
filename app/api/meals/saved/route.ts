import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

const saveSchema = z.object({
  mealId: z.string().min(1),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const saved = await prisma.savedMeal.findMany({
    where: { userId: session.user.id },
    include: {
      meal: {
        select: {
          id: true,
          name: true,
          description: true,
          photoPath: true,
          calories: true,
          protein: true,
          carbs: true,
          fat: true,
          prepMinutes: true,
          cookMinutes: true,
        },
      },
    },
    orderBy: { savedAt: "desc" },
  });

  return NextResponse.json(saved);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const meal = await prisma.meal.findUnique({
    where: { id: parsed.data.mealId },
    select: { id: true },
  });

  if (!meal) {
    return NextResponse.json({ error: "Meal not found" }, { status: 404 });
  }

  const saved = await prisma.savedMeal.upsert({
    where: {
      userId_mealId: {
        userId: session.user.id,
        mealId: parsed.data.mealId,
      },
    },
    update: {
      savedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      mealId: parsed.data.mealId,
    },
  });

  return NextResponse.json(saved);
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const mealId = searchParams.get("mealId");

  if (!id && !mealId) {
    return NextResponse.json({ error: "Missing id or mealId." }, { status: 400 });
  }

  if (id) {
    const saved = await prisma.savedMeal.findUnique({ where: { id } });
    if (!saved || saved.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    await prisma.savedMeal.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }

  await prisma.savedMeal.deleteMany({
    where: { userId: session.user.id, mealId: mealId ?? undefined },
  });

  return NextResponse.json({ ok: true });
}
