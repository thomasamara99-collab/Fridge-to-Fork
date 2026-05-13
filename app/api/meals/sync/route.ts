import { NextResponse } from "next/server";

import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { ensureThemealDbMeals } from "../../../../lib/themealdb";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureThemealDbMeals(prisma, {
    minimumCount: 30,
    batchSize: 12,
    force: true,
  });

  const total = await prisma.meal.count({
    where: { isSeeded: true, tags: { contains: "themealdb" } },
  });

  return NextResponse.json({ ok: true, totalThemealDbMeals: total });
}
