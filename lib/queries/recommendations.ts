import { pool } from "@/lib/db/pool";
import { getSession } from "@/lib/session";
import type { Product } from "@/lib/db/types";

/**
 * "Вам может понравиться" on the product detail page. Logged-in users with
 * order history get products from categories they've bought from before
 * (excluding what they already ordered), ranked hit/new first. Everyone
 * else — and anyone without history — falls back to featured/hit items.
 * Rule-based on purpose: no ML dependency for a catalog this size.
 */
export async function getPersonalizedRecommendations(
  excludeProductId: string,
  fallbackCategoryId: string,
  limit = 4,
): Promise<Product[]> {
  const user = await getSession();

  if (user) {
    const { rows: orderedItems } = await pool.query<{ product_id: string }>(
      `select distinct oi.product_id
       from order_items oi
       join orders o on o.id = oi.order_id
       where o.user_id = $1 and o.status in ('paid', 'preparing', 'ready', 'completed')`,
      [user.id],
    );

    const orderedProductIds = new Set(orderedItems.map((i) => i.product_id));

    if (orderedProductIds.size > 0) {
      const { rows: purchasedCategories } = await pool.query<{ category_id: string }>(
        "select distinct category_id from products where id = any($1::uuid[])",
        [Array.from(orderedProductIds)],
      );

      const preferredCategoryIds = purchasedCategories.map((p) => p.category_id);

      if (preferredCategoryIds.length > 0) {
        const { rows } = await pool.query<Product>(
          `select * from products
           where category_id = any($1::uuid[]) and is_available = true and id <> $2
           order by is_hit desc, is_new desc
           limit $3`,
          [preferredCategoryIds, excludeProductId, limit + orderedProductIds.size],
        );

        const filtered = rows.filter((p) => !orderedProductIds.has(p.id));
        if (filtered.length > 0) return filtered.slice(0, limit);
      }
    }
  }

  const { rows: featured } = await pool.query<Product>(
    `select * from products
     where is_available = true and id <> $1 and (is_featured = true or is_hit = true)
     limit $2`,
    [excludeProductId, limit],
  );
  if (featured.length > 0) return featured;

  const { rows: sameCategory } = await pool.query<Product>(
    `select * from products
     where category_id = $1 and is_available = true and id <> $2
     limit $3`,
    [fallbackCategoryId, excludeProductId, limit],
  );
  return sameCategory;
}
