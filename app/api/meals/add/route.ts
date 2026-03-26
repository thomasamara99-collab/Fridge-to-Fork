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
  emoji: z.string().min(1).max(4).optional().default("🍽️"),
  category: z
    .enum(["breakfast", "protein", "veggie", "carbs", "light", "snack"])
    .optional()
    .default("light"),
  colorTheme: z
    .enum(["amber", "coral", "green", "teal", "blue"])
    .optional()
    .default("amber"),
  calories: z.number().int().min(50),
  protein: z.number().int().min(0),
  carbs: z.number().int().min(0),
  fat: z.number().int().min(0),
  fibre: z.number().int().min(0),
  satiating: z.number().int().min(1).max(5),
  prepMinutes: z.number().int().min(0),
  cookMinutes: z.number().int().min(0),
  difficulty: z.number().int().min(1).max(3),
  tags: z.array(z.string()),
  ingredients: z.array(
    z.object({
      name: z.string(),
      amount: z.string(),
      category: z.string().optional().default("other"),
    }),
  ),
  steps: z.array(z.string()),
  tools: z.array(z.string()),
  allergens: z.array(z.string()),
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
    emoji: formData.get("emoji") ?? undefined,
    category: formData.get("category") ?? undefined,
    colorTheme: formData.get("colorTheme") ?? undefined,
    calories: parseNumber(formData.get("calories")),
    protein: parseNumber(formData.get("protein")),
    carbs: parseNumber(formData.get("carbs")),
    fat: parseNumber(formData.get("fat")),
    fibre: parseNumber(formData.get("fibre")),
    satiating: parseNumber(formData.get("satiating")),
    prepMinutes: parseNumber(formData.get("prepMinutes")),
    cookMinutes: parseNumber(formData.get("cookMinutes")),
    difficulty: parseNumber(formData.get("difficulty")),
    tags: JSON.parse(String(formData.get("tags") ?? "[]")),
    ingredients: JSON.parse(String(formData.get("ingredients") ?? "[]")),
    steps: JSON.parse(String(formData.get("steps") ?? "[]")),
    tools: JSON.parse(String(formData.get("tools") ?? "[]")),
    allergens: JSON.parse(String(formData.get("allergens") ?? "[]")),
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

  const normalizedIngredients = parsed.data.ingredients.map((item) => ({
    ...item,
    category: item.category ?? "other",
  }));

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
      satiating: parsed.data.satiating,
      prepMinutes: parsed.data.prepMinutes,
      cookMinutes: parsed.data.cookMinutes,
      difficulty: parsed.data.difficulty,
      tags: JSON.stringify(parsed.data.tags),
      ingredients: JSON.stringify(normalizedIngredients),
      steps: JSON.stringify(parsed.data.steps),
      tools: JSON.stringify(parsed.data.tools),
      allergens: JSON.stringify(parsed.data.allergens),
      photoPaths: "[]",
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

  const uploadDir = path.join(process.cwd(), "public", "uploads", "meals");
  await fs.mkdir(uploadDir, { recursive: true });

  const files = formData
    .getAll("photos")
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (!files.length) {
    const single = formData.get("photo");
    if (single instanceof File && single.size > 0) {
      files.push(single);
    }
  }

  if (files.length) {
    const storedPaths: string[] = [];
    await Promise.all(
      files.map(async (file, index) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${meal.id}-${index + 1}.jpg`;
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, buffer);
        storedPaths.push(`/uploads/meals/${fileName}`);
      }),
    );

    await prisma.meal.update({
      where: { id: meal.id },
      data: {
        photoPath: storedPaths[0] ?? null,
        photoPaths: JSON.stringify(storedPaths),
      },
    });
  }

  return NextResponse.json(meal);
}
