import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

const fridgeSchema = z.object({
  name: z.string().min(1).max(80),
  category: z.string().min(1).max(40),
  quantity: z.string().optional(),
  expiresAt: z.string().optional(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.fridgeItem.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = fridgeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid item." }, { status: 400 });
  }

  const expiresAt = parsed.data.expiresAt
    ? new Date(parsed.data.expiresAt)
    : null;

  const item = await prisma.fridgeItem.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      category: parsed.data.category,
      quantity: parsed.data.quantity ?? null,
      expiresAt,
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  await prisma.fridgeItem.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
