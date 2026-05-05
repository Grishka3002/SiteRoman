import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const uploadDir = path.join(process.cwd(), "public", "media", "uploads");

const allowedVideoTypes: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const kind = String(formData.get("kind") || "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }

  const fileType = file.type;
  const isImage = kind === "image" && fileType === "image/webp";
  const videoExtension = allowedVideoTypes[fileType];
  const isVideo = kind === "video" && Boolean(videoExtension);

  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Неподдерживаемый формат файла" }, { status: 400 });
  }

  const extension = isImage ? "webp" : videoExtension;
  const filename = `${Date.now()}-${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), bytes);

  return NextResponse.json({
    path: `/media/uploads/${filename}`,
  });
}
