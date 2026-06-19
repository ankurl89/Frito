/**
 * Payment capture — the single place that turns a paid Razorpay payment into a
 * fulfilled order. Called by BOTH the browser callback (/payments/verify) and
 * the Razorpay webhook, so it must be idempotent: whichever arrives first wins,
 * the second is a no-op.
 *
 * Orders are pre-created as `pending_payment` at payment-create time and linked
 * by `payment_order_ref` (the Razorpay order id). Capture finds them, records
 * the payment reference, and advances paid → fulfillment_pending + enqueues the
 * fulfillment job. The state machine's optimistic concurrency guarantees the
 * paid transition applies exactly once even under a browser+webhook race.
 */

import { createServiceClient } from "@/lib/supabase/service";
import { transition } from "@/lib/orders/state-machine";
import { enqueue, kickWorker } from "@/lib/queue/job-queue";
import { awardXP, checkRevenueMilestones } from "@/lib/founder-engine";

export interface CaptureResult {
  ok: boolean;          // did we find orders for this payment?
  orderIds: string[];
  newlyPaid: number;    // how many transitioned pending_payment → paid this call
}

export async function captureRazorpayPayment(
  razorpayOrderId: string,
  paymentId: string,
  actor: string,
): Promise<CaptureResult> {
  const svc = createServiceClient();

  const { data: orders } = await svc
    .from("orders")
    .select("id, status, brand_id")
    .eq("payment_order_ref", razorpayOrderId);

  if (!orders?.length) return { ok: false, orderIds: [], newlyPaid: 0 };

  let newlyPaid = 0;
  let brandId: string | null = null;

  for (const order of orders) {
    // Record the payment reference for reconciliation (idempotent).
    await svc.from("orders").update({ payment_ref: paymentId }).eq("id", order.id);

    const res = await transition(order.id, "paid", {
      event: "order_paid",
      actor,
      metadata: { razorpayOrderId, paymentId },
    });

    // Only the first caller (browser OR webhook) flips pending → paid.
    if (res.ok && !res.skipped) {
      newlyPaid++;
      brandId = order.brand_id;
      await transition(order.id, "fulfillment_pending", { event: "fulfillment_queued", actor: "system" });
      await enqueue({
        type: "fulfillment.submit",
        payload: { orderId: order.id },
        idempotencyKey: `submit:${order.id}`,
      });
    }
  }

  if (newlyPaid > 0 && brandId) {
    const { data: brand } = await svc.from("brands").select("user_id").eq("id", brandId).single();
    if (brand?.user_id) {
      awardXP(brand.user_id, "order_received", { brand_id: brandId })
        .catch(err => console.error("awardXP order_received failed:", err));
      checkRevenueMilestones(brand.user_id, brandId)
        .catch(err => console.error("checkRevenueMilestones failed:", err));
    }
    kickWorker(); // pg_cron is the durable fallback
  }

  return { ok: true, orderIds: orders.map(o => o.id), newlyPaid };
}
