import { NextResponse, type NextRequest } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

// Next's standalone-mode server only recognizes public/ files that existed
// at container boot, so uploads written at runtime (by lib/upload.ts) 404
// through the built-in static handler. This route reads them from disk on
// every request instead, sidestepping that boot-time snapshot entirely.
export async function GET(
  _request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const contentType = CONTENT_TYPES[path.extname(filename).toLowerCase()];
  if (!contentType) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const filePath = path.join(UPLOAD_DIR, filename);

  try {
    const [data, fileStat] = await Promise.all([readFile(filePath), stat(filePath)]);
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileStat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }
}
