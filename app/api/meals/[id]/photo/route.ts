import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

import { auth } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meal = await prisma.meal.findUnique({ where: { id: params.id } });
  if (!meal) {
    return NextResponse.json({ error: "Meal not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("photo");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing photo." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadDir = path.join(process.cwd(), "public", "uploads", "meals");
  await fs.mkdir(uploadDir, { recursive: true });
  const fileName = `${params.id}.jpg`;
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, buffer);

  const storedPath = `/uploads/meals/${fileName}`;
  let photoPaths: string[] = [];
  try {
    photoPaths = JSON.parse(meal.photoPaths) as string[];
  } catch {
    photoPaths = [];
  }
  if (!photoPaths.includes(storedPath)) {
    photoPaths = [storedPath, ...photoPaths];
  }

  await prisma.meal.update({
    where: { id: params.id },
    data: {
      photoPath: storedPath,
      photoPaths: JSON.stringify(photoPaths),
    },
  });

  return NextResponse.json({ ok: true });
}
