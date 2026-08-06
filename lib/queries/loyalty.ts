import { pool } from "@/lib/db/pool";
import { getSession } from "@/lib/session";
import type { Badge, LoyaltyLedgerEntry } from "@/lib/db/types";

export async function getLoyaltyLedger(): Promise<LoyaltyLedgerEntry[]> {
  const user = await getSession();
  if (!user) return [];

  const { rows } = await pool.query<LoyaltyLedgerEntry>(
    "select * from loyalty_ledger where user_id = $1 order by created_at desc limit 50",
    [user.id],
  );
  return rows;
}

export async function getBadgesWithEarnedState(): Promise<
  (Badge & { earned: boolean })[]
> {
  const user = await getSession();
  const { rows: badges } = await pool.query<Badge>("select * from badges");

  if (!user) return badges.map((b) => ({ ...b, earned: false }));

  const { rows: earned } = await pool.query<{ badge_id: string }>(
    "select badge_id from user_badges where user_id = $1",
    [user.id],
  );
  const earnedIds = new Set(earned.map((e) => e.badge_id));

  return badges.map((b) => ({ ...b, earned: earnedIds.has(b.id) }));
}

export const LOYALTY_REASON_LABELS: Record<string, string> = {
  earn_purchase: "Начислено за заказ",
  redeem: "Списано на заказ",
  bonus_signup: "Бонус за регистрацию",
  streak_bonus: "Бонус за серию заказов",
  badge_bonus: "Бонус за достижение",
  admin_adjustment: "Корректировка",
  reversal: "Возврат баллов",
};

export const TIER_LABELS: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
};

export const TIER_THRESHOLDS = { silver: 2000, gold: 5000 } as const;
