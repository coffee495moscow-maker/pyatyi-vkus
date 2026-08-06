import "server-only";
import { headers } from "next/headers";

interface Bucket {
  count: number;
  resetAt: number;
}

// Single-process in-memory limiter — this app runs as one Node process per
// deploy (see docker-compose.yml), so no shared store is needed. Resets on
// restart, which is an acceptable trade-off for a small site.
const buckets = new Map<string, Bucket>();

/** Returns true if the action is allowed, false if the caller is over the limit. */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
