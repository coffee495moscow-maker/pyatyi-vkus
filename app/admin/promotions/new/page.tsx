import { PromotionForm } from "./promotion-form";

export default function NewPromotionPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <h1 className="font-display text-2xl">Новая акция</h1>
      <PromotionForm />
    </div>
  );
}
