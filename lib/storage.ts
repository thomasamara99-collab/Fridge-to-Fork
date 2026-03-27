import path from "path";
import { promises as fs } from "fs";

const getExtension = (file: File, fallback = "jpg") => {
  const type = file.type.toLowerCase();
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  return fallback;
};

export async function saveMealPhoto(
  file: File,
  mealId: string,
  index: number,
) {
  const ext = getExtension(file);
  const fileName = `${mealId}-${index}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`meals/${fileName}`, file, { access: "public" });
    return blob.url;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "meals");
  await fs.mkdir(uploadDir, { recursive: true });
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, buffer);
  return `/uploads/meals/${fileName}`;
}
