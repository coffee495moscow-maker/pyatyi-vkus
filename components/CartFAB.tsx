"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore, cartItemCount } from "@/lib/store/cart";

export function CartFAB() {
  const items = useCartStore((s) => s.items);
  const count = cartItemCount(items);

  if (count === 0) return null;

  return (
    <Link
      href="/cart"
      className="fixed right-5 bottom-24 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-contrast shadow-lg"
    >
      <ShoppingBag size={22} />
      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[11px] font-semibold text-white">
        {count}
      </span>
    </Link>
  );
}
