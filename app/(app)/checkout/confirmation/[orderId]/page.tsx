import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrderWithItems } from "@/lib/queries/orders";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { ClearCartOnMount } from "./clear-cart";

const STATUS_COPY: Record<string, { title: string; description: string }> = {
  paid: {
    title: "Оплата прошла успешно",
    description: "Спасибо за заказ! Мы начали готовить ваш десерт.",
  },
  awaiting_payment: {
    title: "Ожидаем подтверждение оплаты",
    description:
      "Если вы уже оплатили — статус обновится в течение минуты. Обновите страницу.",
  },
  cancelled: {
    title: "Оплата не завершена",
    description: "Заказ отменён. Вы можете оформить его заново.",
  },
  created: {
    title: "Заказ создан",
    description: "Переходим к оплате…",
  },
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const user = await getSession();
  if (!user) redirect(`/login?redirect=/checkout/confirmation/${orderId}`);

  const result = await getOrderWithItems(orderId, user.id);
  if (!result) notFound();
  const { order } = result;

  const copy = STATUS_COPY[order.status] ?? STATUS_COPY.created;

  return (
    <div className="flex flex-col items-center gap-4 px-5 pt-16 text-center">
      <ClearCartOnMount />
      <h1 className="font-display text-2xl">{copy.title}</h1>
      <p className="text-sm text-text-muted">{copy.description}</p>
      <div className="mt-4 w-full max-w-xs rounded-2xl border border-border bg-surface p-5 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">Заказ №</span>
          <span>{order.id.slice(0, 8)}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-text-muted">Сумма</span>
          <span>{formatPrice(order.total_kopecks)}</span>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Link href="/profile/orders">
          <Button variant="outline">Мои заказы</Button>
        </Link>
        <Link href="/menu">
          <Button>В каталог</Button>
        </Link>
      </div>
    </div>
  );
}
