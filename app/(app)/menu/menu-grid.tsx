"use client";

import { useMemo, useState } from "react";
import { CategoryPills } from "@/components/CategoryPills";
import { ProductCard } from "@/components/ProductCard";
import type { Category, Product } from "@/lib/db/types";

export function MenuGrid({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  const [filter, setFilter] = useState("all");

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const filtered =
    filter === "all"
      ? products
      : products.filter((p) => categoryById.get(p.category_id)?.slug === filter);

  const options = [
    { value: "all", label: "Все" },
    ...categories.map((c) => ({ value: c.slug, label: c.name })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <CategoryPills options={options} value={filter} onChange={setFilter} />
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((product) => {
          const category = categoryById.get(product.category_id);
          return (
            <ProductCard
              key={product.id}
              product={product}
              categorySlug={category?.slug ?? ""}
              categoryName={category?.name ?? ""}
            />
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-text-muted">
          В этой категории пока нет позиций.
        </p>
      )}
    </div>
  );
}
