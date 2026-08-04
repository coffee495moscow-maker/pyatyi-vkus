import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/supabase/types";

const ORDER_STATUSES: readonly OrderStatus[] = [
  "created",
  "awaiting_payment",
  "paid",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export async function getAdminDashboardStats() {
  const supabase = await createClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ data: attention }, { data: todayOrders }] = await Promise.all([
    supabase
      .from("orders")
      .select("id")
      .in("status", ["paid", "preparing"]),
    supabase
      .from("orders")
      .select("total_kopecks, status")
      .gte("created_at", startOfDay.toISOString()),
  ]);

  const todayRevenue = (todayOrders ?? [])
    .filter((o) => o.status !== "cancelled" && o.status !== "created")
    .reduce((sum, o) => sum + o.total_kopecks, 0);

  return {
    ordersNeedingAttention: attention?.length ?? 0,
    todayOrderCount: todayOrders?.length ?? 0,
    todayRevenueKopecks: todayRevenue,
  };
}

export async function getAllOrders(statusFilter?: string) {
  const supabase = await createClient();
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all" && isOrderStatus(statusFilter)) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query.limit(100);
  if (error) throw error;
  return data;
}

export async function getAllProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return data;
}

export async function getProductById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAllPromotions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAllB2bInquiries() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("b2b_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
