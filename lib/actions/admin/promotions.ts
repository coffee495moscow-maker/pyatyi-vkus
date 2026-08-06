"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db/pool";
import { requireAdmin } from "@/lib/session";

export type PromotionActionState = { error: string | null };

export async function createPromotion(
  _prevState: PromotionActionState,
  formData: FormData,
): Promise<PromotionActionState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) {
    return { error: "Укажите заголовок акции." };
  }

  try {
    await pool.query(
      "insert into promotions (title, description, is_active) values ($1, $2, false)",
      [title, description],
    );
  } catch {
    return { error: "Не удалось создать акцию." };
  }

  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}

export async function publishPromotion(promotionId: string) {
  await requireAdmin();

  try {
    await pool.query("update promotions set is_active = true where id = $1", [promotionId]);
  } catch {
    return { error: "Не удалось опубликовать акцию." };
  }

  revalidatePath("/admin/promotions");
  revalidatePath("/");
  return { error: null };
}

export async function deactivatePromotion(promotionId: string) {
  await requireAdmin();

  try {
    await pool.query("update promotions set is_active = false where id = $1", [promotionId]);
  } catch {
    return { error: "Не удалось снять акцию с публикации." };
  }

  revalidatePath("/admin/promotions");
  revalidatePath("/");
  return { error: null };
}
