import { getCategories } from "@/lib/queries/products";
import { createProduct } from "@/lib/actions/admin/products";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-6 pb-8">
      <h1 className="font-display text-2xl">Новый товар</h1>
      <ProductForm categories={categories} action={createProduct} />
    </div>
  );
}
