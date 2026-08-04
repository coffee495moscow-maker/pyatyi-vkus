import { createClient } from "@/lib/supabase/server";

export async function getUserOrders() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getOrderWithItems(orderId: string) {
  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw error;
  if (!order) return null;

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  if (itemsError) throw itemsError;

  return { order, items: items ?? [] };
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
