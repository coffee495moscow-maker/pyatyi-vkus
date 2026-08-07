import { pool } from "@/lib/db/pool";
import { getSession } from "@/lib/session";
import type { Order, OrderItem } from "@/lib/db/types";

export async function getUserOrders(): Promise<Order[]> {
  const user = await getSession();
  if (!user) return [];

  const { rows } = await pool.query<Order>(
    "select * from orders where user_id = $1 order by created_at desc",
    [user.id],
  );
  return rows;
}

/**
 * `requireUserId`: pass the signed-in customer's id to enforce ownership
 * (customer-facing pages). Omit only from admin-gated code paths, where the
 * caller (the /admin route) has already checked the role.
 */
export async function getOrderWithItems(
  orderId: string,
  requireUserId?: string,
): Promise<{ order: Order; items: OrderItem[] } | null> {
  const { rows: orderRows } = requireUserId
    ? await pool.query<Order>("select * from orders where id = $1 and user_id = $2", [
        orderId,
        requireUserId,
      ])
    : await pool.query<Order>("select * from orders where id = $1", [orderId]);

  const order = orderRows[0];
  if (!order) return null;

  const { rows: items } = await pool.query<OrderItem>(
    "select * from order_items where order_id = $1",
    [orderId],
  );

  return { order, items };
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  created: "Создан",
  awaiting_payment: "Ожидает оплаты",
  paid: "Оплачен",
  preparing: "Готовится",
  ready: "Готов к выдаче",
  completed: "Выполнен",
  cancelled: "Отменён",
};
