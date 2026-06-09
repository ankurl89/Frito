import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LAUNCH_STEPS, levelForXP, nextLevel } from "@/lib/founder-constants";

/**
 * GET /api/founder/me
 *
 * Returns the founder's progression snapshot:
 *   - profile (xp, level, streak)
 *   - level metadata (current + next)
 *   - achievements unlocked
 *   - launch progress checklist with per-step completion
 *   - recent XP earns
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    { data: profile },
    { data: achievements },
    { data: xpLog },
    { data: brands },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("founder_achievements").select("*").eq("user_id", user.id).order("unlocked_at", { ascending: false }),
    supabase.from("founder_xp_log").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("brands").select("id, brand_book_status").eq("user_id", user.id),
  ]);

  const brandIds = (brands || []).map(b => b.id);

  let productList: { id: string; status: string }[] = [];
  let orderList: { id: string }[] = [];
  if (brandIds.length) {
    const [pRes, oRes] = await Promise.all([
      supabase.from("products").select("id, status").in("brand_id", brandIds),
      supabase.from("orders").select("id").in("brand_id", brandIds),
    ]);
    productList = pRes.data || [];
    orderList = oRes.data || [];
  }

  // Compute launch checklist completion.
  const launchChecklist = LAUNCH_STEPS.map(step => {
    let done = false;
    switch (step.key) {
      case "brand_created": done = brandIds.length > 0; break;
      case "brand_book_ready": done = (brands || []).some(b => b.brand_book_status === "ready"); break;
      case "product_created": done = productList.length > 0; break;
      case "product_published": done = productList.some(p => p.status === "published" || p.status === "active"); break;
      case "first_order": done = orderList.length > 0; break;
    }
    return { ...step, done };
  });

  const completed = launchChecklist.filter(s => s.done).length;
  const launchProgress = Math.round((completed / launchChecklist.length) * 100);

  const xp = profile?.xp ?? 0;
  const current = levelForXP(xp);
  const next = nextLevel(xp);

  return NextResponse.json({
    profile: profile ?? { xp: 0, level: 1, current_streak: 0, longest_streak: 0 },
    level: {
      current,
      next,
      progress_pct: next
        ? Math.round(((xp - current.min_xp) / (next.min_xp - current.min_xp)) * 100)
        : 100,
      xp_to_next: next ? Math.max(0, next.min_xp - xp) : 0,
    },
    achievements: achievements || [],
    xp_log: xpLog || [],
    launch: {
      steps: launchChecklist,
      progress_pct: launchProgress,
      completed,
      total: launchChecklist.length,
    },
  });
}
