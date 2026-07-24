import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ApiError } from "@/lib/rbac";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/** Validates and saves an uploaded image to public/uploads, returning its public URL. */
export async function saveUploadedImage(file: unknown): Promise<string> {
  if (!(file instanceof File)) {
    throw new ApiError(400, "Файл не найден в запросе");
  }
  if (file.size === 0) {
    throw new ApiError(400, "Пустой файл");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new ApiError(400, "Файл превышает 5 МБ");
  }
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new ApiError(400, "Допустимы только изображения: PNG, JPEG, WEBP, GIF");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/${filename}`;
}

const DOCUMENT_MAX_SIZE = 15 * 1024 * 1024; // 15 MB
// Matched by file extension rather than MIME type: browsers report
// inconsistent/generic content-types (e.g. application/octet-stream) for
// legacy Office formats like .doc/.xls, so extension is the reliable signal.
const ALLOWED_DOCUMENT_EXTENSIONS = new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"]);

/** Validates and saves an uploaded document to public/uploads, returning its public URL and original filename. */
export async function saveUploadedDocument(file: unknown): Promise<{ url: string; name: string }> {
  if (!(file instanceof File)) {
    throw new ApiError(400, "Файл не найден в запросе");
  }
  if (file.size === 0) {
    throw new ApiError(400, "Пустой файл");
  }
  if (file.size > DOCUMENT_MAX_SIZE) {
    throw new ApiError(400, "Файл превышает 15 МБ");
  }
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_DOCUMENT_EXTENSIONS.has(extension)) {
    throw new ApiError(400, "Допустимые форматы: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return { url: `/uploads/${filename}`, name: file.name };
}
