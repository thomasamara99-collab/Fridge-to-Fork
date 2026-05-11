import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

const swipeSchema = z.object({
  mealId: z.string(),
  direction: z.enum(["left", "right"]),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = swipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid swipe data." }, { status: 400 });
  }

  const operations: Prisma.PrismaPromise<unknown>[] = [
    prisma.swipe.create({
      data: {
        userId: session.user.id,
        mealId: parsed.data.mealId,
        direction: parsed.data.direction,
      },
    }),
  ];

  if (parsed.data.direction === "right") {
    operations.push(
      prisma.savedMeal.upsert({
        where: {
          userId_mealId: {
            userId: session.user.id,
            mealId: parsed.data.mealId,
          },
        },
        update: { savedAt: new Date() },
        create: {
          userId: session.user.id,
          mealId: parsed.data.mealId,
        },
      }),
    );
  }

  await prisma.$transaction(operations);

  return NextResponse.json({ ok: true });
}
