"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db/pool";
import { requireAdmin } from "@/lib/session";

const ALLOWED_TRANSITIONS = ["preparing", "ready", "completed", "cancelled"];

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const admin = await requireAdmin();

  if (!ALLOWED_TRANSITIONS.includes(newStatus)) {
    return { error: "Недопустимый статус." };
  }

  const client = await pool.connect();
  try {
    await client.query("begin");

    const { rowCount } = await client.query("update orders set status = $1 where id = $2", [
      newStatus,
      orderId,
    ]);

    if (rowCount === 0) {
      await client.query("rollback");
      return { error: "Заказ не найден." };
    }

    await client.query(
      "insert into order_status_history (order_id, status, changed_by) values ($1, $2, $3)",
      [orderId, newStatus, admin.id],
    );

    await client.query("commit");
  } catch {
    await client.query("rollback");
    return { error: "Не удалось изменить статус заказа." };
  } finally {
    client.release();
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { error: null };
}
