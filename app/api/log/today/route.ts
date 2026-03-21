import { NextResponse } from "next/server";

import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const log = await prisma.dailyLog.findFirst({
    where: {
      userId: session.user.id,
      date: { gte: startOfDay, lte: endOfDay },
    },
    include: {
      meals: {
        orderBy: { loggedAt: "desc" },
      },
    },
  });

  if (!log) {
    return NextResponse.json({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      meals: [],
    });
  }

  return NextResponse.json(log);
}
