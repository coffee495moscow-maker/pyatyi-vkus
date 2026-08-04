import { createClient } from "@/lib/supabase/server";

export async function getLoyaltyLedger() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("loyalty_ledger")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}

export async function getBadgesWithEarnedState() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: badges, error } = await supabase
    .from("badges")
    .select("*");

  if (error) throw error;

  if (!user) return (badges ?? []).map((b) => ({ ...b, earned: false }));

  const { data: earned } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", user.id);

  const earnedIds = new Set((earned ?? []).map((e) => e.badge_id));

  return (badges ?? []).map((b) => ({ ...b, earned: earnedIds.has(b.id) }));
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
