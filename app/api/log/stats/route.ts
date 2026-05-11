import { NextResponse } from "next/server";

import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await prisma.dailyLog.findMany({
    where: {
      userId: session.user.id,
      meals: { some: {} },
    },
    select: { date: true },
    orderBy: { date: "asc" },
  });

  const keys = logs.map((log) => toDateKey(log.date));
  const uniqueKeys = Array.from(new Set(keys));

  let longestStreak = 0;
  let currentLongestRun = 0;
  let previousDate: Date | null = null;

  for (const key of uniqueKeys) {
    const date = new Date(`${key}T00:00:00`);
    if (!previousDate) {
      currentLongestRun = 1;
    } else {
      const dayDiff = Math.round(
        (date.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (dayDiff === 1) {
        currentLongestRun += 1;
      } else {
        currentLongestRun = 1;
      }
    }

    if (currentLongestRun > longestStreak) {
      longestStreak = currentLongestRun;
    }

    previousDate = date;
  }

  let streakDays = 0;
  if (uniqueKeys.length) {
    const set = new Set(uniqueKeys);
    const cursor = new Date();

    while (set.has(toDateKey(cursor))) {
      streakDays += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  const recentWeights = await prisma.weightEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { recordedAt: "desc" },
    take: 14,
  });

  return NextResponse.json({
    streakDays,
    longestStreak,
    trackedDays: uniqueKeys.length,
    recentWeights,
  });
}
