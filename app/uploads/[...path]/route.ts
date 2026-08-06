import { NextResponse, type NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.resolve(
  /* turbopackIgnore: true */ process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"),
);

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const requestedPath = path.resolve(UPLOAD_DIR, path.join(...segments));

  // Reject path traversal outside UPLOAD_DIR.
  if (!requestedPath.startsWith(UPLOAD_DIR + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const data = await readFile(/* turbopackIgnore: true */ requestedPath);
    const ext = path.extname(requestedPath).toLowerCase();
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
