import { createHash } from "node:crypto";

export function digestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function safeLocalRedirect(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
