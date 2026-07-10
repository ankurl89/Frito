/**
 * Order State Machine — the ONLY path that may mutate orders.status.
 *
 * Every transition:
 *   1. validates legality against TRANSITIONS
 *   2. updates orders.status
 *   3. writes an append-only order_events row (who / what / when)
 *
 * Provider webhooks can arrive out of order or duplicated, so non-strict
 * transitions are idempotent: same-state is a no-op, illegal ones are
 * skipped (logged, not thrown). Merchant/system-initiated transitions
 * should pass strict:true to surface programming errors.
 */

import { createServiceClient } from "@/lib/supabase/service";
import { OrderState, canTransition, isTerminal } from "./states";

export interface TransitionInput {
  event: string;                              // e.g. "order_paid", "provider_webhook"
  actor: string;                              // "customer" | "system" | "worker" | "provider:qikink" | `merchant:${uid}`
  metadata?: Record<string, unknown>;
  strict?: boolean;                           // throw on illegal transition
}

export interface TransitionResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  from?: OrderState;
  to: OrderState;
}

export async function transition(
  orderId: string,
  to: OrderState,
  { event, actor, metadata = {}, strict = false }: TransitionInput
): Promise<TransitionResult> {
  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    const reason = `Order ${orderId} not found`;
    if (strict) throw new Error(reason);
    return { ok: false, reason, to };
  }

  const from = order.status as OrderState;

  // Idempotent no-op: already in target state.
  if (from === to) {
    return { ok: true, skipped: true, reason: "already in target state", from, to };
  }

  if (!canTransition(from, to)) {
    const reason = `Illegal transition ${from} → ${to}`;
    if (strict) throw new Error(reason);
    // Out-of-order provider webhook (e.g. "shipped" arrives before "packed"
    // was recorded). Skip rather than corrupt the timeline.
    console.warn(`[state-machine] skipped: ${reason} (order ${orderId}, event ${event})`);
    return { ok: false, skipped: true, reason, from, to };
  }

  // Apply + audit in two writes. order_events is append-only so even if the
  // status update is later rolled back, we retain the attempt trail.
  const { error: upErr } = await supabase
    .from("orders")
    .update({ status: to, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", from); // optimistic concurrency: only if still in `from`

  if (upErr) {
    if (strict) throw new Error(upErr.message);
    return { ok: false, reason: upErr.message, from, to };
  }

  await supabase.from("order_events").insert({
    order_id: orderId,
    from_state: from,
    to_state: to,
    event,
    actor,
    metadata,
  });

  // Customer notification on shipping — fire-and-forget so email issues can
  // never fail a state transition. (Dynamic import keeps this module lean for
  // its many callers.)
  if (to === "shipped") {
    import("@/lib/notifications")
      .then(({ sendOrderShipped }) => sendOrderShipped(orderId))
      .catch(err => console.error("shipped email failed:", err));
  }

  return { ok: true, from, to };
}

/** Record the initial state of a freshly created order (from = null). */
export async function recordCreation(
  orderId: string,
  state: OrderState,
  actor: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("order_events").insert({
    order_id: orderId,
    from_state: null,
    to_state: state,
    event: "order_created",
    actor,
    metadata,
  });
}

export { isTerminal };
