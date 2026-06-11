import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { limitsFor, PlanName } from "@/lib/guardrails/limits";

/**
 * GET /api/account/usage — the signed-in user's plan + brand usage.
 * Used by the upgrade page and the onboarding gate so we never let a user run
 * the whole flow only to hit a brand-limit wall at the end.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();
  const [{ data: profile }, { count }] = await Promise.all([
    svc.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
    svc.from("brands").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const plan = ((profile?.plan as PlanName) || "free");
  const limit = limitsFor(plan).brands;
  const brands = count ?? 0;

  return NextResponse.json({ plan, brands, limit, atLimit: brands >= limit });
}
