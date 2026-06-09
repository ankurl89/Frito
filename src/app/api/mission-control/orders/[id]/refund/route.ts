import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePermission } from "@/lib/mission-control/auth";
import { logAdminAction, clientIp } from "@/lib/mission-control/audit";
import { transition } from "@/lib/orders/state-machine";

/**
 * Issue a refund. Today this marks the order refunded + audits it. When the
 * Payment abstraction lands, this also calls PaymentProvider.refund().
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("refund_order");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const svc = createServiceClient();
  const { data: order } = await svc.from("orders").select("status, total_amount").eq("id", id).single();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const result = await transition(id, "refunded", { event: "admin_refund", actor: `staff:${auth.staff.userId}`, strict: false });
  if (!result.ok && !result.skipped) {
    return NextResponse.json({ error: result.reason || "Cannot refund from current state" }, { status: 409 });
  }

  await logAdminAction({
    staff: auth.staff, action: "order.refund", entityType: "order", entityId: id,
    before: { status: order.status }, after: { status: "refunded" },
    metadata: { amount: order.total_amount }, ip: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
