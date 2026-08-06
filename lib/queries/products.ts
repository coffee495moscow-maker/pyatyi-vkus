import { pool } from "@/lib/db/pool";
import type { Category, Product } from "@/lib/db/types";

export async function getCategories(): Promise<Category[]> {
  const { rows } = await pool.query("select * from categories order by sort_order");
  return rows;
}

export async function getProducts(): Promise<Product[]> {
  const { rows } = await pool.query(
    "select * from products where is_available = true order by sort_order",
  );
  return rows;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { rows } = await pool.query(
    "select * from products where slug = $1 and is_available = true",
    [slug],
  );
  return rows[0] ?? null;
}
