"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

export async function getCartRecommendations(
  cartProductIds: string[],
): Promise<Product[]> {
  if (cartProductIds.length === 0) return [];

  const supabase = await createClient();
  const { data: pairs, error } = await supabase.rpc("get_paired_products", {
    p_product_ids: cartProductIds,
    p_limit: 4,
  });

  if (error || !pairs || pairs.length === 0) return [];

  const productIds = pairs.map((p) => p.product_id);
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds)
    .eq("is_available", true);

  if (!products) return [];

  // Preserve the ranking returned by get_paired_products (highest pair_count first).
  const order = new Map(productIds.map((id, idx) => [id, idx]));
  return products.slice().sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
