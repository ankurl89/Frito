import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePermission } from "@/lib/mission-control/auth";
import { logAdminAction, clientIp } from "@/lib/mission-control/audit";
import { transition } from "@/lib/orders/state-machine";
import { enqueue, kickWorker } from "@/lib/queue/job-queue";

/** Retry a failed/stuck fulfillment submission. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("retry_order");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const svc = createServiceClient();
  const { data: order } = await svc.from("orders").select("status").eq("id", id).single();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // If failed, move back into fulfillment_pending so the submit job is valid.
  if (order.status === "failed") {
    await transition(id, "fulfillment_pending", { event: "admin_retry", actor: `staff:${auth.staff.userId}`, strict: false });
  }

  await enqueue({ type: "fulfillment.submit", payload: { orderId: id }, idempotencyKey: `submit:retry:${id}:${Date.now()}` });
  kickWorker();

  await logAdminAction({
    staff: auth.staff, action: "order.retry", entityType: "order", entityId: id,
    before: { status: order.status }, ip: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
