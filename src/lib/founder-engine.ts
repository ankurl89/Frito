/**
 * Founder progression engine — atomic XP + level + streak + achievement updates.
 *
 * All progression-affecting actions (create brand, publish product, first sale,
 * revenue milestones) flow through `awardXP()`. It:
 *   1. Logs the XP earn
 *   2. Increments profile.xp
 *   3. Recalculates profile.level
 *   4. Updates streak (current + longest)
 *   5. Unlocks any qualifying achievements
 *   6. Returns whatever was newly unlocked so the caller can surface it
 *
 * Server-only — imports next/headers via supabase server client.
 */

import { createClient } from "@/lib/supabase/server";
import {
  XP_RULES, XPAction, ACHIEVEMENTS, REVENUE_MILESTONES, levelForXP,
} from "./founder-constants";

interface AwardResult {
  xp_earned: number;
  total_xp: number;
  level: number;
  level_up: boolean;
  unlocked: string[];        // achievement keys newly unlocked
  current_streak: number;
}

export async function awardXP(
  userId: string,
  action: XPAction,
  metadata: Record<string, unknown> = {}
): Promise<AwardResult> {
  const supabase = await createClient();
  const xp = XP_RULES[action];

  // 1. Log the earn
  await supabase.from("founder_xp_log").insert({
    user_id: userId, action, xp_earned: xp, metadata,
  });

  // 2. Read current profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level, current_streak, longest_streak, last_active_date")
    .eq("id", userId)
    .single();

  const prevXp = profile?.xp ?? 0;
  const prevLevel = profile?.level ?? 1;
  const newXp = prevXp + xp;
  const newLevel = levelForXP(newXp).level;

  // 3. Streak update
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const last = profile?.last_active_date as string | undefined;

  let currentStreak = profile?.current_streak ?? 0;
  if (last === today) {
    // same day — no streak change
  } else if (last === yesterday) {
    currentStreak += 1;
  } else {
    currentStreak = 1; // reset
  }
  const longestStreak = Math.max(profile?.longest_streak ?? 0, currentStreak);

  // 4. Update profile
  await supabase
    .from("profiles")
    .update({
      xp: newXp,
      level: newLevel,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_active_date: today,
    })
    .eq("id", userId);

  // 5. Check for newly unlocked achievements
  const unlocked = await checkAchievements(userId, action, currentStreak);

  return {
    xp_earned: xp,
    total_xp: newXp,
    level: newLevel,
    level_up: newLevel > prevLevel,
    unlocked,
    current_streak: currentStreak,
  };
}

/**
 * Award XP for a one-time achievement-style event.
 * Idempotent — if the achievement is already unlocked, this is a no-op.
 */
export async function unlockAchievement(
  userId: string,
  achievementKey: string,
  metadata: Record<string, unknown> = {}
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("founder_achievements")
    .insert({ user_id: userId, achievement_key: achievementKey, metadata });
  // Unique constraint violation = already unlocked
  return !error;
}

/**
 * Check action-triggered achievements and unlock anything qualifying.
 * Returns newly-unlocked keys.
 */
async function checkAchievements(
  userId: string,
  action: XPAction,
  currentStreak: number
): Promise<string[]> {
  const supabase = await createClient();
  const unlocked: string[] = [];

  // Pull what's already unlocked so we don't duplicate work.
  const { data: existing } = await supabase
    .from("founder_achievements")
    .select("achievement_key")
    .eq("user_id", userId);
  const has = new Set((existing || []).map(r => r.achievement_key));

  const tryUnlock = async (key: string) => {
    if (has.has(key) || !ACHIEVEMENTS[key]) return;
    const ok = await unlockAchievement(userId, key);
    if (ok) unlocked.push(key);
  };

  // Map action → achievement.
  if (action === "brand_created") await tryUnlock("first_brand");
  if (action === "product_created") await tryUnlock("first_product");
  if (action === "product_published") {
    await tryUnlock("first_publish");

    // Count product-publish achievements (5, 25).
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");
    if ((count ?? 0) >= 5) await tryUnlock("catalog_5");
    if ((count ?? 0) >= 25) await tryUnlock("catalog_25");
  }
  if (action === "order_received") await tryUnlock("first_sale");

  // Revenue milestones — keyed XP actions map directly.
  for (const m of REVENUE_MILESTONES) {
    if (action === m.key) await tryUnlock(m.key);
  }

  // Streak achievements
  if (currentStreak >= 7) await tryUnlock("streak_7");
  if (currentStreak >= 30) await tryUnlock("streak_30");

  // Night-owl: any action between 00:00 and 04:00 local
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 4) await tryUnlock("night_owl");

  return unlocked;
}

/**
 * Check if the user has crossed any new revenue milestones based on cumulative revenue.
 * Awards XP for each newly-crossed threshold.
 */
export async function checkRevenueMilestones(userId: string, brandId: string): Promise<string[]> {
  const supabase = await createClient();

  // Total revenue across all brands owned by user.
  const { data: brands } = await supabase
    .from("brands")
    .select("id")
    .eq("user_id", userId);
  const brandIds = (brands || []).map(b => b.id);
  if (!brandIds.length) return [];

  const { data: orders } = await supabase
    .from("orders")
    .select("total_amount")
    .in("brand_id", brandIds);
  const totalRevenue = (orders || []).reduce((s, o) => s + (o.total_amount || 0), 0);

  // What's already unlocked?
  const { data: existing } = await supabase
    .from("founder_achievements")
    .select("achievement_key")
    .eq("user_id", userId);
  const has = new Set((existing || []).map(r => r.achievement_key));

  const newlyCrossed: string[] = [];
  for (const m of REVENUE_MILESTONES) {
    if (totalRevenue >= m.threshold && !has.has(m.key)) {
      await awardXP(userId, m.key as XPAction, { brand_id: brandId, total_revenue: totalRevenue });
      newlyCrossed.push(m.key);
    }
  }
  return newlyCrossed;
}
