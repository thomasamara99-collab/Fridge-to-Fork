import { NextResponse } from "next/server";
import { z } from "zod";

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

  await prisma.swipe.create({
    data: {
      userId: session.user.id,
      mealId: parsed.data.mealId,
      direction: parsed.data.direction,
    },
  });

  return NextResponse.json({ ok: true });
}
