import { notFound } from "next/navigation";
import { getOrderWithItems, ORDER_STATUS_LABELS } from "@/lib/queries/orders";
import { formatPrice } from "@/lib/utils";
import { OrderStatusActions } from "./order-status-actions";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getOrderWithItems(id);
  if (!result) notFound();
  const { order, items } = result;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl">Заказ №{order.id.slice(0, 8)}</h1>
        <p className="text-sm text-text-muted">
          {new Date(order.created_at).toLocaleString("ru-RU")} ·{" "}
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </p>
      </div>

      <OrderStatusActions orderId={order.id} currentStatus={order.status} />

      <div className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-2 text-sm font-semibold text-text-muted">Контакты</h2>
        <p className="text-sm">Телефон: {order.contact_phone || "—"}</p>
        {order.pickup_note && <p className="text-sm">Самовывоз: {order.pickup_note}</p>}
        {order.comment && <p className="text-sm">Комментарий: {order.comment}</p>}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-text-muted">Состав заказа</h2>
        <div className="flex flex-col divide-y divide-border">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between py-2 text-sm">
              <span>
                {item.product_name_snapshot} × {item.quantity}
              </span>
              <span>{formatPrice(item.subtotal_kopecks)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between text-text-muted">
            <span>Сумма</span>
            <span>{formatPrice(order.subtotal_kopecks)}</span>
          </div>
          {order.discount_kopecks > 0 && (
            <div className="flex justify-between text-accent">
              <span>Скидка баллами ({order.points_redeemed})</span>
              <span>-{formatPrice(order.discount_kopecks)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-text">
            <span>Итого</span>
            <span>{formatPrice(order.total_kopecks)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
