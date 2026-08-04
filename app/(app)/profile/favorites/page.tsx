import { getUserFavoriteProductsWithCategories } from "@/lib/queries/favorites";
import { ProductCard } from "@/components/ProductCard";

export default async function FavoritesPage() {
  const { products, categories } = await getUserFavoriteProductsWithCategories();
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-6 px-5 pt-8 pb-4">
      <h1 className="font-display text-2xl">Избранное</h1>
      {products.length === 0 && (
        <p className="text-sm text-text-muted">
          Добавляйте десерты в избранное значком сердца на странице товара.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => {
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
    </div>
  );
}
