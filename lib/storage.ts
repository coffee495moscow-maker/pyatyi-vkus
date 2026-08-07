import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * Confirms the buffer is actually one of the image formats we accept by
 * checking magic bytes — never trust the browser-supplied `file.type` or
 * the original filename's extension, both are client-controlled. Deliberately
 * excludes SVG: it's XML and can carry executable script, so we don't accept
 * or serve user-uploaded SVGs at all.
 */
function detectImageType(buffer: Buffer): { ext: string; mime: string } | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: ".jpg", mime: "image/jpeg" };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { ext: ".png", mime: "image/png" };
  }
  if (
    buffer.length >= 6 &&
    buffer.toString("ascii", 0, 3) === "GIF" &&
    (buffer.toString("ascii", 3, 6) === "87a" || buffer.toString("ascii", 3, 6) === "89a")
  ) {
    return { ext: ".gif", mime: "image/gif" };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { ext: ".webp", mime: "image/webp" };
  }
  return null;
}

export class InvalidUploadError extends Error {}

/**
 * Saves an uploaded File to local disk under UPLOAD_DIR/<subdir>/ and
 * returns the public URL path it's served at (see app/uploads/[...path]).
 * UPLOAD_DIR should be a persistent volume in production (see docker-compose.yml).
 * Throws InvalidUploadError for anything that isn't a recognized image
 * under the size cap — callers should catch it and show a form error.
 */
export async function saveUploadedFile(file: File, subdir: string): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new InvalidUploadError("Файл слишком большой (максимум 8 МБ).");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectImageType(buffer);
  if (!detected) {
    throw new InvalidUploadError("Поддерживаются только изображения: JPEG, PNG, GIF, WebP.");
  }

  const dir = path.join(/* turbopackIgnore: true */ UPLOAD_DIR, subdir);
  await mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${detected.ext}`;
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/${subdir}/${filename}`;
}
