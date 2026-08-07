"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db/pool";
import { getSession } from "@/lib/session";

export async function toggleFavorite(productId: string, path: string) {
  const user = await getSession();
  if (!user) {
    return { error: "Войдите, чтобы добавлять в избранное." };
  }

  const { rowCount } = await pool.query(
    "delete from favorites where user_id = $1 and product_id = $2",
    [user.id, productId],
  );

  if (rowCount === 0) {
    await pool.query(
      "insert into favorites (user_id, product_id) values ($1, $2) on conflict do nothing",
      [user.id, productId],
    );
  }

  revalidatePath(path);
  return { error: null };
}

export async function getFavoriteProductIds(): Promise<Set<string>> {
  const user = await getSession();
  if (!user) return new Set();

  const { rows } = await pool.query<{ product_id: string }>(
    "select product_id from favorites where user_id = $1",
    [user.id],
  );

  return new Set(rows.map((f) => f.product_id));
}
