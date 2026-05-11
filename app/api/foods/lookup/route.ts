import { NextResponse } from "next/server";

import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

type OpenFoodFactsProduct = {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: Record<string, number | string | undefined>;
};

const toInt = (value: unknown) => {
  const num = typeof value === "string" ? Number(value) : Number(value ?? 0);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.round(num));
};

const getNutrient = (
  nutriments: Record<string, number | string | undefined> | undefined,
  keys: string[],
) => {
  if (!nutriments) return 0;
  for (const key of keys) {
    if (nutriments[key] !== undefined) {
      return toInt(nutriments[key]);
    }
  }
  return 0;
};

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode")?.trim();

  if (!barcode) {
    return NextResponse.json({ error: "Missing barcode" }, { status: 400 });
  }

  const item = await prisma.foodItem.findUnique({ where: { barcode } });

  if (item) {
    return NextResponse.json(item);
  }

  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
    {
      headers: {
        "User-Agent": "FridgeToFork/1.0 (support@fridgetofork.com)",
      },
      cache: "no-store",
    },
  ).catch(() => null);

  if (!response?.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const payload = (await response.json()) as {
    status?: number;
    product?: OpenFoodFactsProduct;
  };

  if (payload.status !== 1 || !payload.product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const product = payload.product;
  const calories = getNutrient(product.nutriments, [
    "energy-kcal_serving",
    "energy-kcal_100g",
    "energy-kcal",
  ]);
  const protein = getNutrient(product.nutriments, ["proteins_serving", "proteins_100g", "proteins"]);
  const carbs = getNutrient(product.nutriments, [
    "carbohydrates_serving",
    "carbohydrates_100g",
    "carbohydrates",
  ]);
  const fat = getNutrient(product.nutriments, ["fat_serving", "fat_100g", "fat"]);

  const created = await prisma.foodItem.upsert({
    where: { barcode },
    update: {
      name: product.product_name?.trim() || "Unknown product",
      brand: product.brands?.trim() || null,
      servingSize: product.serving_size?.trim() || null,
      calories,
      protein,
      carbs,
      fat,
    },
    create: {
      barcode,
      name: product.product_name?.trim() || "Unknown product",
      brand: product.brands?.trim() || null,
      servingSize: product.serving_size?.trim() || null,
      calories,
      protein,
      carbs,
      fat,
      createdBy: session.user.id,
    },
  });

  return NextResponse.json(created);
}
