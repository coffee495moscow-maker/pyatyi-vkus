import { createClient } from "@/lib/supabase/server";

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
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: paidOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["paid", "preparing", "ready", "completed"]);

    const paidOrderIds = (paidOrders ?? []).map((o) => o.id);

    const { data: orderedItems } = paidOrderIds.length
      ? await supabase.from("order_items").select("product_id").in("order_id", paidOrderIds)
      : { data: [] as { product_id: string }[] };

    const orderedProductIds = new Set(
      (orderedItems ?? []).map((i) => i.product_id),
    );

    if (orderedProductIds.size > 0) {
      const { data: purchasedProducts } = await supabase
        .from("products")
        .select("category_id")
        .in("id", Array.from(orderedProductIds));

      const preferredCategoryIds = Array.from(
        new Set((purchasedProducts ?? []).map((p) => p.category_id)),
      );

      if (preferredCategoryIds.length > 0) {
        const { data } = await supabase
          .from("products")
          .select("*")
          .in("category_id", preferredCategoryIds)
          .eq("is_available", true)
          .neq("id", excludeProductId)
          .order("is_hit", { ascending: false })
          .order("is_new", { ascending: false })
          .limit(limit + orderedProductIds.size);

        const filtered = (data ?? []).filter((p) => !orderedProductIds.has(p.id));
        if (filtered.length > 0) return filtered.slice(0, limit);
      }
    }
  }

  const { data: featured } = await supabase
    .from("products")
    .select("*")
    .eq("is_available", true)
    .neq("id", excludeProductId)
    .or("is_featured.eq.true,is_hit.eq.true")
    .limit(limit);

  if (featured && featured.length > 0) return featured;

  const { data: sameCategory } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", fallbackCategoryId)
    .eq("is_available", true)
    .neq("id", excludeProductId)
    .limit(limit);

  return sameCategory ?? [];
}
