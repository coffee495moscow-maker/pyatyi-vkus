import { getCurrentProfile } from "@/lib/queries/profile";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display px-5 pt-8 text-2xl">Оформление заказа</h1>
      <CheckoutForm
        pointsBalance={profile?.points_balance ?? 0}
        defaultPhone={profile?.phone ?? ""}
      />
    </div>
  );
}
