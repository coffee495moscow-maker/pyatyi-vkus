"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db/pool";
import { requireAdmin } from "@/lib/session";
import { canTransitionOrder } from "@/lib/order-transitions";

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const admin = await requireAdmin();

  const client = await pool.connect();
  try {
    await client.query("begin");

    const { rows } = await client.query<{ status: string }>(
      "select status from orders where id = $1 for update",
      [orderId],
    );
    const order = rows[0];
    if (!order) {
      await client.query("rollback");
      return { error: "Заказ не найден." };
    }
    if (!canTransitionOrder(order.status, newStatus)) {
      await client.query("rollback");
      return { error: "Этот переход статуса недопустим." };
    }

    await client.query("update orders set status = $1 where id = $2", [newStatus, orderId]);

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
