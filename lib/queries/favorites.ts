import { createClient } from "@/lib/supabase/server";

export async function getUserFavoriteProductsWithCategories() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { products: [], categories: [] };

  const { data: favorites, error } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const productIds = (favorites ?? []).map((f) => f.product_id);
  if (productIds.length === 0) return { products: [], categories: [] };

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").in("id", productIds),
    supabase.from("categories").select("*"),
  ]);

  // Preserve favorited-most-recently-first order.
  const bySlugOrder = new Map(productIds.map((id, idx) => [id, idx]));
  const sorted = (products ?? []).slice().sort(
    (a, b) => (bySlugOrder.get(a.id) ?? 0) - (bySlugOrder.get(b.id) ?? 0),
  );

  return { products: sorted, categories: categories ?? [] };
}
