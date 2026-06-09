import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { awardXP, unlockAchievement } from "@/lib/founder-engine";

/**
 * POST /api/founder/award-signup
 * Awards the `account_created` XP + unlocks the Dreamer badge.
 * Idempotent — if already awarded, the unique constraint on
 * founder_achievements drops the duplicate.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if we've already logged a signup XP earn for this user.
  const { data: existing } = await supabase
    .from("founder_xp_log")
    .select("id")
    .eq("user_id", user.id)
    .eq("action", "account_created")
    .limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ already_awarded: true });
  }

  await awardXP(user.id, "account_created", { source: "signup" });
  await unlockAchievement(user.id, "signed_up", {});
  return NextResponse.json({ awarded: true });
}
