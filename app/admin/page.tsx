import Link from "next/link";
import { getAdminDashboardStats } from "@/lib/queries/admin";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl">Обзор</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/admin/orders"
          className="rounded-2xl border border-accent/50 bg-surface p-5 hover:border-accent"
        >
          <p className="text-xs text-text-muted">Требуют внимания</p>
          <p className="font-display mt-2 text-3xl">{stats.ordersNeedingAttention}</p>
          <p className="text-xs text-text-muted">заказов (оплачены/готовятся)</p>
        </Link>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted">Заказов сегодня</p>
          <p className="font-display mt-2 text-3xl">{stats.todayOrderCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs text-text-muted">Выручка сегодня</p>
          <p className="font-display mt-2 text-3xl">
            {formatPrice(stats.todayRevenueKopecks)}
          </p>
        </div>
      </div>
    </div>
  );
}
