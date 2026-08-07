"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db/pool";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { sendMail, isMailConfigured } from "@/lib/mail";
import { digestToken, safeLocalRedirect } from "@/lib/security";

export type AuthActionState = { error: string | null };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeLocalRedirect(String(formData.get("redirectTo") ?? "/"));

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

  const { rows } = await pool.query("select id from users where email = $1", [email]);
  const user = rows[0];

  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await pool.query(
      "insert into password_resets (token, user_id, expires_at) values ($1, $2, $3)",
      [digestToken(token), user.id, expiresAt],
    );

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const resetUrl = `${siteUrl}/update-password?token=${token}`;

    if (isMailConfigured()) {
      await sendMail(
        email,
        "Пятый вкус — восстановление пароля",
        `Перейдите по ссылке, чтобы задать новый пароль: ${resetUrl}\n\nСсылка действует 1 час.`,
      );
    } else {
      // Do not expose a bearer link in logs. Production must configure SMTP
      // before offering password recovery.
      console.warn("Password reset requested while SMTP is not configured");
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

  const passwordHash = await hashPassword(password);
  const client = await pool.connect();
  let userId: string | undefined;
  try {
    await client.query("begin");
    const { rows } = await client.query<{ user_id: string }>(
      `delete from password_resets
       where token = $1 and expires_at > now()
       returning user_id`,
      [digestToken(token)],
    );
    const reset = rows[0];
    if (!reset) {
      await client.query("rollback");
      return { error: "Ссылка недействительна или устарела. Запросите новую." };
    }

    userId = reset.user_id;
    await client.query("update users set password_hash = $1 where id = $2", [passwordHash, userId]);
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
