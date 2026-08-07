import { pool } from "@/lib/db/pool";
import type { Category, Product } from "@/lib/db/types";
import {
  previewCategories,
  previewProducts,
  shouldUsePreviewCatalog,
} from "@/lib/preview-catalog";

export async function getCategories(): Promise<Category[]> {
  if (shouldUsePreviewCatalog()) return previewCategories;

  const { rows } = await pool.query("select * from categories order by sort_order");
  return rows;
}

export async function getProducts(): Promise<Product[]> {
  if (shouldUsePreviewCatalog()) return previewProducts;

  const { rows } = await pool.query(
    "select * from products where is_available = true order by sort_order",
  );
  return rows;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (shouldUsePreviewCatalog()) {
    return previewProducts.find((product) => product.slug === slug) ?? null;
  }

  const { rows } = await pool.query(
    "select * from products where slug = $1 and is_available = true",
    [slug],
  );
  return rows[0] ?? null;
}
