import Link from "next/link";
import { getAllProducts } from "@/lib/queries/admin";
import { getCategories } from "@/lib/queries/products";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { AvailabilityToggle } from "./availability-toggle";

export default async function AdminMenuPage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getCategories(),
  ]);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Меню</h1>
        <Link href="/admin/menu/new">
          <Button>Добавить товар</Button>
        </Link>
      </div>
      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-3 bg-surface px-4 py-3">
            <div className="flex-1">
              <p className="font-medium">{product.name}</p>
              <p className="text-xs text-text-muted">
                {categoryById.get(product.category_id)?.name} ·{" "}
                {formatPrice(product.price_kopecks)}
              </p>
            </div>
            <AvailabilityToggle
              productId={product.id}
              isAvailable={product.is_available}
            />
            <Link
              href={`/admin/menu/${product.id}/edit`}
              className="text-sm text-accent hover:underline"
            >
              Изменить
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
