import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePermission } from "@/lib/mission-control/auth";
import { logAdminAction, clientIp } from "@/lib/mission-control/audit";

/**
 * POST /api/mission-control/payouts/verify-account — mark a founder's payout
 * details verified (after a manual check / penny test) or rejected. Payouts
 * can only be recorded against verified details. Audit-logged.
 */
export async function POST(req: NextRequest) {
  const auth = await requirePermission("manage_payouts");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { user_id, status } = await req.json();
  if (!user_id || !["verified", "rejected"].includes(status)) {
    return NextResponse.json({ error: "user_id and a status of verified/rejected are required" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data: existing } = await svc.from("payout_accounts").select("id, status").eq("user_id", user_id).maybeSingle();
  if (!existing) return NextResponse.json({ error: "No payout details on file" }, { status: 404 });

  const { error } = await svc
    .from("payout_accounts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("user_id", user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    staff: auth.staff, action: `payout_account.${status}`, entityType: "payout_account", entityId: existing.id,
    before: { status: existing.status }, after: { status }, ip: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
