import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEarnings, REFUND_BUFFER_DAYS } from "@/lib/payouts";

/**
 * GET /api/account/earnings — the signed-in founder's earnings ledger:
 * lifetime earned, pending clearance, available for payout, paid out,
 * per-brand breakdown, and payout history. Derived server-side; see
 * lib/payouts.ts for the rules.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const earnings = await getEarnings(user.id);
  return NextResponse.json({ ...earnings, refundBufferDays: REFUND_BUFFER_DAYS });
}
