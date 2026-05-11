import { NextResponse } from "next/server";

import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = Math.min(90, Math.max(7, Number(searchParams.get("days") ?? "30")));

  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  const logs = await prisma.dailyLog.findMany({
    where: {
      userId: session.user.id,
      date: { gte: start },
    },
    include: {
      meals: {
        orderBy: { loggedAt: "desc" },
      },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(logs);
}
