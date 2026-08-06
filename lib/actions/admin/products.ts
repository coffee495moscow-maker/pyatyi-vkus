"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db/pool";
import { requireAdmin } from "@/lib/session";
import { saveUploadedFile } from "@/lib/storage";

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

async function uploadImageIfProvided(formData: FormData): Promise<string | undefined> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return undefined;
  return saveUploadedFile(file, "products");
}

export async function createProduct(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAdmin();
  const fields = parseProductForm(formData);

  if (!fields.slug || !fields.name || !fields.category_id) {
    return { error: "Заполните название, ЧПУ-слаг и категорию." };
  }

  const imagePath = await uploadImageIfProvided(formData);

  try {
    await pool.query(
      `insert into products
         (slug, name, description, price_kopecks, category_id, is_available, is_new, is_hit, is_featured, image_path)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        fields.slug,
        fields.name,
        fields.description,
        fields.price_kopecks,
        fields.category_id,
        fields.is_available,
        fields.is_new,
        fields.is_hit,
        fields.is_featured,
        imagePath ?? null,
      ],
    );
  } catch {
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
  await requireAdmin();
  const fields = parseProductForm(formData);

  if (!fields.slug || !fields.name || !fields.category_id) {
    return { error: "Заполните название, ЧПУ-слаг и категорию." };
  }

  const imagePath = await uploadImageIfProvided(formData);

  try {
    if (imagePath) {
      await pool.query(
        `update products set
           slug = $1, name = $2, description = $3, price_kopecks = $4, category_id = $5,
           is_available = $6, is_new = $7, is_hit = $8, is_featured = $9,
           image_path = $10, updated_at = now()
         where id = $11`,
        [
          fields.slug,
          fields.name,
          fields.description,
          fields.price_kopecks,
          fields.category_id,
          fields.is_available,
          fields.is_new,
          fields.is_hit,
          fields.is_featured,
          imagePath,
          productId,
        ],
      );
    } else {
      await pool.query(
        `update products set
           slug = $1, name = $2, description = $3, price_kopecks = $4, category_id = $5,
           is_available = $6, is_new = $7, is_hit = $8, is_featured = $9, updated_at = now()
         where id = $10`,
        [
          fields.slug,
          fields.name,
          fields.description,
          fields.price_kopecks,
          fields.category_id,
          fields.is_available,
          fields.is_new,
          fields.is_hit,
          fields.is_featured,
          productId,
        ],
      );
    }
  } catch {
    return { error: "Не удалось сохранить изменения." };
  }

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath(`/menu/${fields.slug}`);
  redirect("/admin/menu");
}

export async function toggleProductAvailability(productId: string, isAvailable: boolean) {
  await requireAdmin();

  try {
    await pool.query("update products set is_available = $1 where id = $2", [
      isAvailable,
      productId,
    ]);
  } catch {
    return { error: "Не удалось обновить доступность товара." };
  }

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  return { error: null };
}
