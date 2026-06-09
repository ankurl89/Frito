import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePermission } from "@/lib/mission-control/auth";
import { logAdminAction, clientIp } from "@/lib/mission-control/audit";
import { transition } from "@/lib/orders/state-machine";
import { getProvider } from "@/lib/fulfillment/registry";

/** Cancel an order; sends a provider cancel if already submitted. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("cancel_order");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const svc = createServiceClient();
  const { data: order } = await svc.from("orders").select("status").eq("id", id).single();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Best-effort provider cancellation.
  const { data: fo } = await svc.from("fulfillment_orders").select("provider, provider_order_id, sandbox").eq("order_id", id).maybeSingle();
  if (fo?.provider_order_id && !fo.sandbox) {
    try {
      await getProvider(fo.provider).cancelOrder(fo.provider_order_id);
    } catch (err) {
      console.error("Provider cancel failed (continuing with local cancel):", err);
    }
  }

  const result = await transition(id, "cancelled", { event: "admin_cancel", actor: `staff:${auth.staff.userId}`, strict: false });
  if (!result.ok && !result.skipped) {
    return NextResponse.json({ error: result.reason || "Cannot cancel from current state" }, { status: 409 });
  }

  await logAdminAction({
    staff: auth.staff, action: "order.cancel", entityType: "order", entityId: id,
    before: { status: order.status }, after: { status: "cancelled" }, ip: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
