import { getCategories, getProducts } from "@/lib/queries/products";
import { MenuGrid } from "./menu-grid";

export default async function MenuPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  return (
    <div className="flex flex-col gap-6 px-5 pt-8 pb-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          Коллекция
        </p>
        <h1 className="font-display mt-2 text-3xl">Десерты «Пятый вкус»</h1>
      </div>
      <MenuGrid categories={categories} products={products} />
    </div>
  );
}
