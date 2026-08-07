import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { pool } from "@/lib/db/pool";
import { digestToken } from "@/lib/security";
import type { PublicUser } from "@/lib/db/types";

const SESSION_COOKIE = "session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const COOKIE_SECURE = process.env.NODE_ENV === "production";

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenDigest = digestToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await pool.query("insert into sessions (id, user_id, expires_at) values ($1, $2, $3)", [
    tokenDigest,
    userId,
    expiresAt,
  ]);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await pool.query("delete from sessions where id = $1", [digestToken(token)]);
  }

  cookieStore.delete(SESSION_COOKIE);
}

/** Reads the session cookie and returns the signed-in user, or null. */
export async function getSession(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { rows } = await pool.query(
    `select u.id, u.email, u.full_name, u.phone, u.role, u.points_balance,
            u.lifetime_points, u.tier, u.current_streak_weeks, u.last_order_week,
            u.last_order_at, u.created_at
     from sessions s
     join users u on u.id = s.user_id
     where s.id = $1 and s.expires_at > now()`,
    [digestToken(token)],
  );

  return rows[0] ?? null;
}

/** Throws-free helper for Server Actions/pages that require auth. */
export async function requireSession(): Promise<PublicUser> {
  const user = await getSession();
  if (!user) {
    throw new Error("not_authenticated");
  }
  return user;
}

export async function requireAdmin(): Promise<PublicUser> {
  const user = await requireSession();
  if (user.role !== "admin") {
    throw new Error("not_authorized");
  }
  return user;
}
