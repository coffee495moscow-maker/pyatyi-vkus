"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore, cartTotalKopecks } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const total = cartTotalKopecks(items);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-5 pt-16 text-center">
        <h1 className="font-display text-2xl">Корзина пуста</h1>
        <p className="text-sm text-text-muted">
          Загляните в коллекцию, чтобы выбрать десерты.
        </p>
        <Link href="/menu">
          <Button>Смотреть коллекцию</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-5 pt-8 pb-4">
      <h1 className="font-display text-2xl">Корзина</h1>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
          >
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-text-muted">
                {formatPrice(item.priceKopecks)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity(item.productId, item.quantity - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border"
                aria-label="Уменьшить количество"
              >
                <Minus size={14} />
              </button>
              <span className="w-5 text-center text-sm">{item.quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(item.productId, item.quantity + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border"
                aria-label="Увеличить количество"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => remove(item.productId)}
              className="text-text-muted hover:text-danger"
              aria-label="Удалить"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-text-muted">Итого</span>
        <span className="font-display text-2xl">{formatPrice(total)}</span>
      </div>
      <Link href="/checkout">
        <Button size="lg" className="w-full">
          Оформить заказ
        </Button>
      </Link>
    </div>
  );
}
