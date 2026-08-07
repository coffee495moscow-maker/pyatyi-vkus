import { notFound } from "next/navigation";
import { getCategories } from "@/lib/queries/products";
import { getProductById } from "@/lib/queries/admin";
import { updateProduct } from "@/lib/actions/admin/products";
import { ProductForm } from "../../product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ]);

  if (!product) notFound();

  const boundUpdate = updateProduct.bind(null, product.id);

  return (
    <div className="flex flex-col gap-6 pb-8">
      <h1 className="font-display text-2xl">Изменить товар</h1>
      <ProductForm categories={categories} product={product} action={boundUpdate} />
    </div>
  );
}
