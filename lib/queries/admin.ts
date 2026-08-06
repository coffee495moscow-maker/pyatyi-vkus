import { pool } from "@/lib/db/pool";
import type {
  B2bInquiry,
  Order,
  OrderStatus,
  Product,
  Promotion,
} from "@/lib/db/types";

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
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ rows: attention }, { rows: todayOrders }] = await Promise.all([
    pool.query<{ id: string }>(
      "select id from orders where status in ('paid', 'preparing')",
    ),
    pool.query<{ total_kopecks: number; status: OrderStatus }>(
      "select total_kopecks, status from orders where created_at >= $1",
      [startOfDay.toISOString()],
    ),
  ]);

  const todayRevenue = todayOrders
    .filter((o) => o.status !== "cancelled" && o.status !== "created")
    .reduce((sum, o) => sum + o.total_kopecks, 0);

  return {
    ordersNeedingAttention: attention.length,
    todayOrderCount: todayOrders.length,
    todayRevenueKopecks: todayRevenue,
  };
}

export async function getAllOrders(statusFilter?: string): Promise<Order[]> {
  if (statusFilter && statusFilter !== "all" && isOrderStatus(statusFilter)) {
    const { rows } = await pool.query<Order>(
      "select * from orders where status = $1 order by created_at desc limit 100",
      [statusFilter],
    );
    return rows;
  }

  const { rows } = await pool.query<Order>(
    "select * from orders order by created_at desc limit 100",
  );
  return rows;
}

export async function getAllProducts(): Promise<Product[]> {
  const { rows } = await pool.query<Product>("select * from products order by sort_order");
  return rows;
}

export async function getProductById(id: string): Promise<Product | null> {
  const { rows } = await pool.query<Product>("select * from products where id = $1", [id]);
  return rows[0] ?? null;
}

export async function getAllPromotions(): Promise<Promotion[]> {
  const { rows } = await pool.query<Promotion>(
    "select * from promotions order by created_at desc",
  );
  return rows;
}

export async function getAllB2bInquiries(): Promise<B2bInquiry[]> {
  const { rows } = await pool.query<B2bInquiry>(
    "select * from b2b_inquiries order by created_at desc",
  );
  return rows;
}
