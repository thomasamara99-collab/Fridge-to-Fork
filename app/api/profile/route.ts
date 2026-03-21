import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

const profileSchema = z.object({
  weightKg: z.number().min(30).max(250),
  heightCm: z.number().min(120).max(230),
  age: z.number().int().min(14).max(90),
  sex: z.string(),
  goal: z.string(),
  activityLevel: z.string(),
  targetCalories: z.number().int().min(500).max(8000),
  targetProtein: z.number().int().min(0).max(400),
  targetCarbs: z.number().int().min(0).max(800),
  targetFat: z.number().int().min(0).max(300),
  calculatedTdee: z.number().int().min(500).max(9000),
  dietaryFilters: z.string(),
  dislikedIngredients: z.string(),
  cuisinePrefs: z.string(),
  cookingSkill: z.string(),
  budget: z.string(),
  trainingDays: z.string(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const existing = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  if (!existing) {
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid profile data." }, { status: 400 });
    }

    const profile = await prisma.profile.create({
      data: {
        ...parsed.data,
        userId: session.user.id,
      },
    });

    return NextResponse.json(profile);
  }

  const parsed = profileSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile update." }, { status: 400 });
  }

  const updated = await prisma.profile.update({
    where: { userId: session.user.id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}
