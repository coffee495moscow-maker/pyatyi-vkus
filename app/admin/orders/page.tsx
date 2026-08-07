import Link from "next/link";
import { getAllOrders } from "@/lib/queries/admin";
import { ORDER_STATUS_LABELS } from "@/lib/queries/orders";
import { formatPrice } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "Все" },
  { value: "paid", label: "Оплачены" },
  { value: "preparing", label: "Готовятся" },
  { value: "ready", label: "Готовы" },
  { value: "completed", label: "Выполнены" },
  { value: "cancelled", label: "Отменены" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const orders = await getAllOrders(status);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl">Заказы</h1>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/orders" : `/admin/orders?status=${f.value}`}
            className={`pill border px-3 py-1.5 text-sm ${
              (status ?? "all") === f.value
                ? "border-accent bg-accent text-accent-contrast"
                : "border-border text-text-muted"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>
      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/admin/orders/${order.id}`}
            className="flex items-center justify-between bg-surface px-4 py-3 hover:bg-surface-elevated"
          >
            <div>
              <p className="font-medium">№{order.id.slice(0, 8)}</p>
              <p className="text-xs text-text-muted">
                {new Date(order.created_at).toLocaleString("ru-RU")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatPrice(order.total_kopecks)}</p>
              <p className="text-xs text-text-muted">
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </p>
            </div>
          </Link>
        ))}
        {orders.length === 0 && (
          <p className="bg-surface px-4 py-6 text-center text-sm text-text-muted">
            Нет заказов по этому фильтру.
          </p>
        )}
      </div>
    </div>
  );
}
