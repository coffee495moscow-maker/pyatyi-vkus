"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db/pool";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { sendMail, isMailConfigured } from "@/lib/mail";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export type AuthActionState = { error: string | null };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Only ever redirect to a same-origin path — blocks open-redirect payloads like "https://evil.com" or "//evil.com". */
function safeRedirectPath(value: string): string {
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirectPath(String(formData.get("redirectTo") ?? "/"));

  const ip = await getClientIp();
  if (!checkRateLimit(`signin:${ip}:${email}`, 10, 15 * 60 * 1000)) {
    return { error: "Слишком много попыток входа. Попробуйте через несколько минут." };
  }

  const { rows } = await pool.query("select id, password_hash from users where email = $1", [
    email,
  ]);
  const user = rows[0];

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { error: "Неверный email или пароль." };
  }

  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!EMAIL_RE.test(email)) {
    return { error: "Введите корректный email." };
  }
  if (password.length < 8) {
    return { error: "Пароль должен быть не короче 8 символов." };
  }

  const ip = await getClientIp();
  if (!checkRateLimit(`signup:${ip}`, 5, 60 * 60 * 1000)) {
    return { error: "Слишком много регистраций с этого адреса. Попробуйте позже." };
  }

  const client = await pool.connect();
  let userId: string;
  try {
    await client.query("begin");

    const { rows: existing } = await client.query("select id from users where email = $1", [
      email,
    ]);
    if (existing.length > 0) {
      await client.query("rollback");
      return { error: "Этот email уже зарегистрирован." };
    }

    const passwordHash = await hashPassword(password);
    const { rows } = await client.query(
      "insert into users (email, password_hash, full_name) values ($1, $2, $3) returning id",
      [email, passwordHash, fullName || null],
    );
    userId = rows[0].id;

    // Signup bonus — same mechanic as the earn/redeem ledger for orders.
    await client.query(
      "insert into loyalty_ledger (user_id, delta_points, reason) values ($1, 50, 'bonus_signup')",
      [userId],
    );

    await client.query("commit");
  } catch {
    await client.query("rollback");
    return { error: "Не удалось зарегистрироваться. Попробуйте ещё раз." };
  } finally {
    client.release();
  }

  await createSession(userId);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const ip = await getClientIp();
  if (!checkRateLimit(`reset:${ip}:${email}`, 5, 60 * 60 * 1000)) {
    // Still report generic success — don't let the rate limit itself leak
    // whether the email is registered.
    return { error: null };
  }

  const { rows } = await pool.query("select id from users where email = $1", [email]);
  const user = rows[0];

  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await pool.query(
      "insert into password_resets (token, user_id, expires_at) values ($1, $2, $3)",
      [token, user.id, expiresAt],
    );

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const resetUrl = `${siteUrl}/update-password?token=${token}`;

    if (isMailConfigured()) {
      await sendMail(
        email,
        "Пятый вкус — восстановление пароля",
        `Перейдите по ссылке, чтобы задать новый пароль: ${resetUrl}\n\nСсылка действует 1 час.`,
      );
    } else if (process.env.NODE_ENV !== "production") {
      // No SMTP configured yet — surface the link in local/dev logs only so
      // the flow is testable. Never do this in production: the token is a
      // bearer credential for the account, and container logs may be more
      // widely readable than the mailbox it would otherwise go to.
      console.warn(`Password reset link for ${email}: ${resetUrl}`);
    }
  }

  // Always report success to avoid leaking which emails are registered.
  return { error: null };
}

export async function updatePassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    return { error: "Пароль должен быть не короче 8 символов." };
  }

  const client = await pool.connect();
  let userId: string;
  try {
    await client.query("begin");

    // Atomically consume the token — a DELETE...RETURNING means only one
    // concurrent request (double-click, retried form) can ever get a row
    // back, closing the reuse race a plain select-then-delete would allow.
    const { rows } = await client.query(
      "delete from password_resets where token = $1 and expires_at > now() returning user_id",
      [token],
    );
    const reset = rows[0];

    if (!reset) {
      await client.query("rollback");
      return { error: "Ссылка недействительна или устарела. Запросите новую." };
    }

    userId = reset.user_id;
    const passwordHash = await hashPassword(password);
    await client.query("update users set password_hash = $1 where id = $2", [
      passwordHash,
      userId,
    ]);

    // Invalidate every other session for this account — a password reset
    // should also kick out anyone else (or anything else) still logged in.
    await client.query("delete from sessions where user_id = $1", [userId]);

    await client.query("commit");
  } catch {
    await client.query("rollback");
    return { error: "Не удалось обновить пароль. Попробуйте ещё раз." };
  } finally {
    client.release();
  }

  await createSession(userId);
  redirect("/profile");
}
