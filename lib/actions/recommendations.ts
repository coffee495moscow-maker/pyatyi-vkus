"use server";

import { pool } from "@/lib/db/pool";
import type { Product } from "@/lib/db/types";

export async function getCartRecommendations(
  cartProductIds: string[],
): Promise<Product[]> {
  if (cartProductIds.length === 0) return [];

  const { rows: pairs } = await pool.query<{ product_id: string; pair_count: number }>(
    "select * from get_paired_products($1::uuid[], 4)",
    [cartProductIds],
  );

  if (pairs.length === 0) return [];

  const productIds = pairs.map((p) => p.product_id);
  const { rows: products } = await pool.query<Product>(
    "select * from products where id = any($1::uuid[]) and is_available = true",
    [productIds],
  );

  // Preserve the ranking returned by get_paired_products (highest pair_count first).
  const order = new Map(productIds.map((id, idx) => [id, idx]));
  return products.slice().sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
