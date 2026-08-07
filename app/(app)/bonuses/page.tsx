import { redirect } from "next/navigation";
import { Award, Lock } from "lucide-react";
import { getCurrentProfile } from "@/lib/queries/profile";
import {
  getBadgesWithEarnedState,
  getLoyaltyLedger,
  LOYALTY_REASON_LABELS,
  TIER_LABELS,
  TIER_THRESHOLDS,
} from "@/lib/queries/loyalty";
import { cn } from "@/lib/utils";

function nextTierProgress(lifetimePoints: number, tier: string) {
  if (tier === "gold") return { label: "Максимальный уровень", percent: 100 };
  const target = tier === "silver" ? TIER_THRESHOLDS.gold : TIER_THRESHOLDS.silver;
  const base = tier === "silver" ? TIER_THRESHOLDS.silver : 0;
  const percent = Math.min(
    100,
    Math.round(((lifetimePoints - base) / (target - base)) * 100),
  );
  return {
    label: `До уровня ${tier === "silver" ? "Gold" : "Silver"}: ${Math.max(target - lifetimePoints, 0)} баллов`,
    percent,
  };
}

export default async function BonusesPage() {
  const [profile, ledger, badges] = await Promise.all([
    getCurrentProfile(),
    getLoyaltyLedger(),
    getBadgesWithEarnedState(),
  ]);

  if (!profile) redirect("/login?redirect=/bonuses");

  const tier = profile?.tier ?? "bronze";
  const progress = nextTierProgress(profile?.lifetime_points ?? 0, tier);

  return (
    <div className="flex flex-col gap-8 px-5 pt-8 pb-4">
      <div className="rounded-3xl border border-border bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          {TIER_LABELS[tier]}
        </p>
        <p className="font-display mt-2 text-4xl">{profile?.points_balance ?? 0}</p>
        <p className="text-sm text-text-muted">баллов на счету</p>
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-text-muted">{progress.label}</p>
        </div>
        {(profile?.current_streak_weeks ?? 0) > 0 && (
          <p className="mt-3 text-xs text-text-muted">
            Серия заказов: {profile?.current_streak_weeks} нед. подряд
          </p>
        )}
      </div>

      <div>
        <h2 className="font-display mb-4 text-xl">Достижения</h2>
        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center",
                badge.earned
                  ? "border-accent/50 bg-surface"
                  : "border-border bg-surface/50 opacity-50",
              )}
            >
              {badge.earned ? (
                <Award size={24} className="text-accent" />
              ) : (
                <Lock size={20} className="text-text-muted" />
              )}
              <p className="text-sm font-medium">{badge.title}</p>
              <p className="text-xs text-text-muted">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display mb-4 text-xl">История баллов</h2>
        {ledger.length === 0 && (
          <p className="text-sm text-text-muted">Пока нет операций.</p>
        )}
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border">
          {ledger.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between bg-surface px-4 py-3">
              <div>
                <p className="text-sm">{LOYALTY_REASON_LABELS[entry.reason] ?? entry.reason}</p>
                <p className="text-xs text-text-muted">
                  {new Date(entry.created_at).toLocaleDateString("ru-RU")}
                </p>
              </div>
              <span
                className={cn(
                  "font-semibold",
                  entry.delta_points >= 0 ? "text-success" : "text-danger",
                )}
              >
                {entry.delta_points >= 0 ? "+" : ""}
                {entry.delta_points}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
