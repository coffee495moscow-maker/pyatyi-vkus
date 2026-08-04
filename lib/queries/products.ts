import { createClient } from "@/lib/supabase/server";

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return data;
}

export async function getProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_available", true)
    .order("sort_order");

  if (error) throw error;
  return data;
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_available", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getRelatedProducts(categoryId: string, excludeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_available", true)
    .neq("id", excludeId)
    .order("is_hit", { ascending: false })
    .limit(4);

  if (error) throw error;
  return data;
}
