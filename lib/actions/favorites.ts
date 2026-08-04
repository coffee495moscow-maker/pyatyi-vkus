"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleFavorite(productId: string, path: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Войдите, чтобы добавлять в избранное." };
  }

  const { data: existing } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);
  } else {
    await supabase.from("favorites").insert({ user_id: user.id, product_id: productId });
  }

  revalidatePath(path);
  return { error: null };
}

export async function getFavoriteProductIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Set();

  const { data } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", user.id);

  return new Set((data ?? []).map((f) => f.product_id));
}
