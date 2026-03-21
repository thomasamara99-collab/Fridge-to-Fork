import { NextResponse } from "next/server";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";

import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

const stringToBool = (value: FormDataEntryValue | null) =>
  value === "true" || value === "1";

const parseNumber = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const mealSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(120).optional(),
  emoji: z.string().min(1).max(4),
  category: z.enum([
    "breakfast",
    "protein",
    "veggie",
    "carbs",
    "light",
    "snack",
  ]),
  colorTheme: z.enum(["amber", "coral", "green", "teal", "blue"]),
  calories: z.number().int().min(50),
  protein: z.number().int().min(0),
  carbs: z.number().int().min(0),
  fat: z.number().int().min(0),
  fibre: z.number().int().min(0),
  prepMinutes: z.number().int().min(0),
  cookMinutes: z.number().int().min(0),
  difficulty: z.number().int().min(1).max(3),
  tags: z.array(z.string()),
  ingredients: z.array(
    z.object({
      name: z.string(),
      amount: z.string(),
      category: z.string(),
    }),
  ),
  steps: z.array(z.string()),
  isVegetarian: z.boolean(),
  isVegan: z.boolean(),
  isGlutenFree: z.boolean(),
  isDairyFree: z.boolean(),
  isHalal: z.boolean(),
  isKosher: z.boolean(),
  isNutFree: z.boolean(),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();

  const parsed = mealSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    emoji: formData.get("emoji") ?? "🍽️",
    category: formData.get("category"),
    colorTheme: formData.get("colorTheme"),
    calories: parseNumber(formData.get("calories")),
    protein: parseNumber(formData.get("protein")),
    carbs: parseNumber(formData.get("carbs")),
    fat: parseNumber(formData.get("fat")),
    fibre: parseNumber(formData.get("fibre")),
    prepMinutes: parseNumber(formData.get("prepMinutes")),
    cookMinutes: parseNumber(formData.get("cookMinutes")),
    difficulty: parseNumber(formData.get("difficulty")),
    tags: JSON.parse(String(formData.get("tags") ?? "[]")),
    ingredients: JSON.parse(String(formData.get("ingredients") ?? "[]")),
    steps: JSON.parse(String(formData.get("steps") ?? "[]")),
    isVegetarian: stringToBool(formData.get("isVegetarian")),
    isVegan: stringToBool(formData.get("isVegan")),
    isGlutenFree: stringToBool(formData.get("isGlutenFree")),
    isDairyFree: stringToBool(formData.get("isDairyFree")),
    isHalal: stringToBool(formData.get("isHalal")),
    isKosher: stringToBool(formData.get("isKosher")),
    isNutFree: stringToBool(formData.get("isNutFree")),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid meal data." }, { status: 400 });
  }

  const meal = await prisma.meal.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? "",
      emoji: parsed.data.emoji,
      photoPath: null,
      category: parsed.data.category,
      colorTheme: parsed.data.colorTheme,
      calories: parsed.data.calories,
      protein: parsed.data.protein,
      carbs: parsed.data.carbs,
      fat: parsed.data.fat,
      fibre: parsed.data.fibre,
      prepMinutes: parsed.data.prepMinutes,
      cookMinutes: parsed.data.cookMinutes,
      difficulty: parsed.data.difficulty,
      tags: JSON.stringify(parsed.data.tags),
      ingredients: JSON.stringify(parsed.data.ingredients),
      steps: JSON.stringify(parsed.data.steps),
      isVegetarian: parsed.data.isVegetarian,
      isVegan: parsed.data.isVegan,
      isGlutenFree: parsed.data.isGlutenFree,
      isDairyFree: parsed.data.isDairyFree,
      isHalal: parsed.data.isHalal,
      isKosher: parsed.data.isKosher,
      isNutFree: parsed.data.isNutFree,
      isSeeded: false,
      createdBy: session.user.id,
    },
  });

  const file = formData.get("photo");
  if (file && file instanceof File && file.size > 0) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "meals");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, `${meal.id}.jpg`);
    await fs.writeFile(filePath, buffer);

    await prisma.meal.update({
      where: { id: meal.id },
      data: { photoPath: `/uploads/meals/${meal.id}.jpg` },
    });
  }

  return NextResponse.json(meal);
}
