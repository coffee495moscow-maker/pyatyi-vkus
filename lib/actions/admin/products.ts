"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export type ProductActionState = { error: string | null };

function parseProductForm(formData: FormData) {
  return {
    slug: String(formData.get("slug") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    price_kopecks: Math.round(Number(formData.get("priceRub") ?? 0) * 100),
    category_id: String(formData.get("categoryId") ?? ""),
    is_available: formData.get("isAvailable") === "on",
    is_new: formData.get("isNew") === "on",
    is_hit: formData.get("isHit") === "on",
    is_featured: formData.get("isFeatured") === "on",
  };
}

async function uploadImageIfProvided(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formData: FormData,
  slug: string,
): Promise<string | null | undefined> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return undefined;

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${slug}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: true });

  if (error) return null;

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function createProduct(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const supabase = await createClient();
  const fields = parseProductForm(formData);

  if (!fields.slug || !fields.name || !fields.category_id) {
    return { error: "Заполните название, ЧПУ-слаг и категорию." };
  }

  const imagePath = await uploadImageIfProvided(supabase, formData, fields.slug);

  const { error } = await supabase.from("products").insert({
    ...fields,
    image_path: imagePath || null,
  });

  if (error) {
    return { error: "Не удалось создать товар. Проверьте уникальность слага." };
  }

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  redirect("/admin/menu");
}

export async function updateProduct(
  productId: string,
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const supabase = await createClient();
  const fields = parseProductForm(formData);

  if (!fields.slug || !fields.name || !fields.category_id) {
    return { error: "Заполните название, ЧПУ-слаг и категорию." };
  }

  const imagePath = await uploadImageIfProvided(supabase, formData, fields.slug);

  const update: ProductUpdate = { ...fields };
  if (imagePath !== undefined && imagePath !== null) update.image_path = imagePath;

  const { error } = await supabase.from("products").update(update).eq("id", productId);

  if (error) {
    return { error: "Не удалось сохранить изменения." };
  }

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath(`/menu/${fields.slug}`);
  redirect("/admin/menu");
}

export async function toggleProductAvailability(productId: string, isAvailable: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_available: isAvailable })
    .eq("id", productId);

  if (error) return { error: "Не удалось обновить доступность товара." };

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  return { error: null };
}
