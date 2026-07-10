import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePermission } from "@/lib/mission-control/auth";
import { logAdminAction, clientIp } from "@/lib/mission-control/audit";
import { getEarnings } from "@/lib/payouts";

/**
 * POST /api/mission-control/payouts/record — record a payout made to a founder.
 *
 * Phase-1 flow: staff make the bank transfer manually, then record it here
 * with the UTR/reference. Guards: payout details must be verified, and the
 * amount can never exceed the founder's available balance (server-computed).
 * Audit-logged. A payout rail (Phase 3) will automate the transfer itself.
 */
export async function POST(req: NextRequest) {
  const auth = await requirePermission("manage_payouts");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { user_id, amount, reference, notes } = await req.json();
  const amt = Number(amount);
  if (!user_id || !Number.isFinite(amt) || amt <= 0) {
    return NextResponse.json({ error: "A user and a positive amount are required" }, { status: 400 });
  }
  if (!reference || !String(reference).trim()) {
    return NextResponse.json({ error: "Enter the bank/UTR reference of the transfer" }, { status: 400 });
  }

  const svc = createServiceClient();

  const { data: account } = await svc.from("payout_accounts").select("status").eq("user_id", user_id).maybeSingle();
  if (!account) return NextResponse.json({ error: "Founder has not added payout details" }, { status: 409 });
  if (account.status !== "verified") {
    return NextResponse.json({ error: "Payout details are not verified yet" }, { status: 409 });
  }

  const earnings = await getEarnings(user_id);
  if (amt > earnings.available) {
    return NextResponse.json(
      { error: `Amount exceeds available balance (₹${earnings.available.toLocaleString("en-IN")})` },
      { status: 409 }
    );
  }

  const { data: payout, error } = await svc
    .from("payouts")
    .insert({
      user_id,
      amount: amt,
      reference: String(reference).trim(),
      notes: notes ? String(notes) : null,
      created_by: auth.staff.userId,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    staff: auth.staff, action: "payout.record", entityType: "payout", entityId: payout.id,
    after: { user_id, amount: amt, reference }, ip: clientIp(req),
  });

  return NextResponse.json({ ok: true, id: payout.id });
}
