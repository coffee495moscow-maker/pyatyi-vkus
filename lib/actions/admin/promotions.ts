"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PromotionActionState = { error: string | null };

export async function createPromotion(
  _prevState: PromotionActionState,
  formData: FormData,
): Promise<PromotionActionState> {
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title) {
    return { error: "Укажите заголовок акции." };
  }

  const { error } = await supabase.from("promotions").insert({
    title,
    description,
    is_active: false,
  });

  if (error) {
    return { error: "Не удалось создать акцию." };
  }

  revalidatePath("/admin/promotions");
  redirect("/admin/promotions");
}

/**
 * Flips is_active true and stamps notified_at. A Postgres Database Webhook
 * on promotions UPDATE (configured in the Supabase dashboard/CLI, see
 * supabase/functions/send-push) picks up the notified_at transition and
 * broadcasts a push to all subscribers — no push logic lives here.
 */
export async function publishAndNotifyPromotion(promotionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("promotions")
    .update({ is_active: true, notified_at: new Date().toISOString() })
    .eq("id", promotionId);

  if (error) return { error: "Не удалось опубликовать акцию." };

  revalidatePath("/admin/promotions");
  revalidatePath("/");
  return { error: null };
}

export async function deactivatePromotion(promotionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("promotions")
    .update({ is_active: false })
    .eq("id", promotionId);

  if (error) return { error: "Не удалось снять акцию с публикации." };

  revalidatePath("/admin/promotions");
  revalidatePath("/");
  return { error: null };
}
