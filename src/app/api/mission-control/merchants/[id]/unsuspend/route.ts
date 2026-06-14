import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePermission } from "@/lib/mission-control/auth";
import { logAdminAction, clientIp } from "@/lib/mission-control/audit";

/** Reinstate a suspended merchant: brings the storefront back online. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("suspend_merchant");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const svc = createServiceClient();
  const { data: brand } = await svc.from("brands").select("status").eq("id", id).single();
  if (!brand) return NextResponse.json({ error: "Merchant not found" }, { status: 404 });
  if (brand.status !== "suspended") return NextResponse.json({ ok: true });

  const { error } = await svc.from("brands").update({ status: "active" }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    staff: auth.staff, action: "merchant.unsuspend", entityType: "merchant", entityId: id,
    before: { status: "suspended" }, after: { status: "active" }, ip: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
