import { NextResponse } from "next/server";

import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

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

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}
