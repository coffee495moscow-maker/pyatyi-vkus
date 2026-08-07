import Link from "next/link";
import { getUserOrders, ORDER_STATUS_LABELS } from "@/lib/queries/orders";
import { formatPrice } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  paid: "text-success",
  preparing: "text-accent",
  ready: "text-success",
  completed: "text-text-muted",
  cancelled: "text-danger",
  awaiting_payment: "text-text-muted",
  created: "text-text-muted",
};

export default async function OrdersPage() {
  const orders = await getUserOrders();

  return (
    <div className="flex flex-col gap-6 px-5 pt-8 pb-4">
      <h1 className="font-display text-2xl">История заказов</h1>
      {orders.length === 0 && (
        <p className="text-sm text-text-muted">У вас пока нет заказов.</p>
      )}
      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/checkout/confirmation/${order.id}`}
            className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4"
          >
            <div>
              <p className="font-medium">Заказ №{order.id.slice(0, 8)}</p>
              <p className="text-xs text-text-muted">
                {new Date(order.created_at).toLocaleDateString("ru-RU")}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatPrice(order.total_kopecks)}</p>
              <p className={`text-xs ${STATUS_TONE[order.status] ?? "text-text-muted"}`}>
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
