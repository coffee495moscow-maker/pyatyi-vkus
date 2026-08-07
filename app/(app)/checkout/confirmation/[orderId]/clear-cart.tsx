"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/store/cart";

export function ClearCartOnMount() {
  const clear = useCartStore((s) => s.clear);
  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
