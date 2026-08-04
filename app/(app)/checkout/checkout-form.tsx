"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useCartStore, cartTotalKopecks } from "@/lib/store/cart";
import { checkout, type CheckoutActionState } from "@/lib/actions/checkout";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

const initialState: CheckoutActionState = { error: null };

export function CheckoutForm({
  pointsBalance,
  defaultPhone,
}: {
  pointsBalance: number;
  defaultPhone: string;
}) {
  const items = useCartStore((s) => s.items);
  const subtotal = cartTotalKopecks(items);
  const maxRedeemable = Math.min(pointsBalance, Math.floor((subtotal * 0.5) / 100));
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [state, formAction, pending] = useActionState(checkout, initialState);

  const discount = pointsToRedeem * 100;
  const total = Math.max(subtotal - discount, 0);

  if (items.length === 0) {
    return (
      <div className="px-5 pt-16 text-center">
        <p className="text-text-muted">Корзина пуста.</p>
        <Link href="/menu" className="mt-3 inline-block text-accent">
          Перейти в каталог →
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5 px-5 pt-6 pb-4">
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        )}
      />
      <input type="hidden" name="pointsToRedeem" value={pointsToRedeem} />

      <div>
        <Label htmlFor="contactPhone">Телефон для связи</Label>
        <Input
          id="contactPhone"
          name="contactPhone"
          type="tel"
          required
          defaultValue={defaultPhone}
          placeholder="+7 900 000-00-00"
        />
      </div>
      <div>
        <Label htmlFor="pickupNote">Комментарий к самовывозу</Label>
        <Input id="pickupNote" name="pickupNote" placeholder="Например, желаемое время" />
      </div>
      <div>
        <Label htmlFor="comment">Комментарий к заказу</Label>
        <Textarea id="comment" name="comment" rows={3} />
      </div>

      {maxRedeemable > 0 && (
        <div>
          <Label htmlFor="points">
            Списать баллы (доступно {pointsBalance}, максимум {maxRedeemable} на этот заказ)
          </Label>
          <Input
            id="points"
            type="number"
            min={0}
            max={maxRedeemable}
            value={pointsToRedeem}
            onChange={(e) =>
              setPointsToRedeem(
                Math.min(maxRedeemable, Math.max(0, Number(e.target.value) || 0)),
              )
            }
          />
        </div>
      )}

      <div className="flex flex-col gap-1 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-text-muted">
          <span>Сумма заказа</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-accent">
            <span>Скидка баллами</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-semibold text-text">
          <span>Итого</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Переходим к оплате…" : "Оплатить картой"}
      </Button>
    </form>
  );
}
