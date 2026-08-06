import { pool } from "@/lib/db/pool";
import { getSession } from "@/lib/session";
import type { Category, Product } from "@/lib/db/types";

export async function getUserFavoriteProductsWithCategories(): Promise<{
  products: Product[];
  categories: Category[];
}> {
  const user = await getSession();
  if (!user) return { products: [], categories: [] };

  const { rows: products } = await pool.query<Product>(
    `select p.* from favorites f
     join products p on p.id = f.product_id
     where f.user_id = $1
     order by f.created_at desc`,
    [user.id],
  );

  if (products.length === 0) return { products: [], categories: [] };

  const { rows: categories } = await pool.query<Category>("select * from categories");

  return { products, categories };
}
