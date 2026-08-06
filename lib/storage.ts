import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

function safeExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return ext || ".jpg";
}

/**
 * Saves an uploaded File to local disk under UPLOAD_DIR/<subdir>/ and
 * returns the public URL path it's served at (see app/uploads/[...path]).
 * UPLOAD_DIR should be a persistent volume in production (see docker-compose.yml).
 */
export async function saveUploadedFile(file: File, subdir: string): Promise<string> {
  const dir = path.join(/* turbopackIgnore: true */ UPLOAD_DIR, subdir);
  await mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExtension(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/${subdir}/${filename}`;
}
