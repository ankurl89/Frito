import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { awardXP, checkRevenueMilestones } from "@/lib/founder-engine";
import { recordCreation, transition } from "@/lib/orders/state-machine";
import { enqueue, kickWorker } from "@/lib/queue/job-queue";
import { guardIp } from "@/lib/guardrails/guard";
import { razorpayConfigured, verifyRazorpaySignature } from "@/lib/razorpay";
import { sendOrderConfirmation, sendFounderSaleAlert } from "@/lib/notifications";

/**
 * POST /api/store/orders — customer checkout.
 *
 * Public endpoint. Flow:
 *   1. Idempotency check (header `idempotency-key`) — double-submit safe.
 *   2. Create order(s) as `paid` (payment simulated).
 *   3. Transition paid → fulfillment_pending (audited).
 *   4. Enqueue a durable `fulfillment.submit` job per order.
 *   5. Kick the worker (non-blocking) — pg_cron is the durable fallback.
 *
 * The order is NEVER submitted to a provider synchronously here — that's the
 * Fulfillment Engine's job, off the checkout hot path, with retries.
 */
export async function POST(req: NextRequest) {
  // IP rate limit — public endpoint; stops checkout/order spam.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (!(await guardIp(ip, "checkout", 12))) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const body = await req.json();
  const {
    brand_slug, customer_name, customer_email, customer_phone, shipping_address, items,
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
  } = body;
  // Natural idempotency: one payment → one set of orders.
  const idempotencyKey = req.headers.get("idempotency-key") || razorpay_payment_id || null;

  if (!brand_slug || !customer_name || !shipping_address || !items?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // ── Payment gate ──
  // When Razorpay is configured, an order can only be created against a payment
  // whose signature verifies. Without keys (e.g. before they're set in an env),
  // fall back to the simulated flow so nothing breaks.
  if (razorpayConfigured()) {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }
    const verified = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!verified) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }
  }

  // Use service client — checkout is unauthenticated but trusted to write orders.
  const svc = createServiceClient();

  // ── Idempotency: replay the stored response for a repeated key ──
  if (idempotencyKey) {
    const { data: seen } = await svc
      .from("idempotency_keys")
      .select("response")
      .eq("key", idempotencyKey)
      .maybeSingle();
    if (seen?.response) {
      return NextResponse.json(seen.response);
    }
  }

  // Resolve brand.
  const { data: brand } = await svc.from("brands").select("id, user_id").eq("slug", brand_slug).single();
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  // Price each line item from the source of truth (never trust client prices blindly).
  const productIds = items.map((i: { product_id: string }) => i.product_id);
  const { data: products } = await svc
    .from("products")
    .select("id, base_cost, sell_price, status")
    .in("id", productIds);
  const productMap = new Map((products || []).map(p => [p.id, p]));

  // Build order rows — created directly as `paid`.
  const rows = items.map((item: { product_id: string; size?: string; color?: string; quantity: number; price: number }) => {
    const prod = productMap.get(item.product_id);
    const baseCost = prod?.base_cost ?? 0;
    const sellPrice = prod?.sell_price ?? item.price ?? 0; // authoritative server price
    const totalAmount = sellPrice * item.quantity;
    const costAmount = baseCost * item.quantity;
    return {
      brand_id: brand.id,
      product_id: item.product_id,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      variant: { size: item.size, color: item.color, price: sellPrice },
      quantity: item.quantity,
      total_amount: totalAmount,
      cost_amount: costAmount,
      profit_amount: totalAmount - costAmount,
      status: "paid",
    };
  });

  const { data: created, error } = await svc.from("orders").insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!created?.length) return NextResponse.json({ error: "Order creation failed" }, { status: 500 });

  // Audit creation + move into fulfillment + enqueue submission for each order.
  for (const order of created) {
    await recordCreation(order.id, "paid", "customer", { brand_slug });
    await transition(order.id, "fulfillment_pending", { event: "fulfillment_queued", actor: "system" });
    await enqueue({
      type: "fulfillment.submit",
      payload: { orderId: order.id },
      idempotencyKey: `submit:${order.id}`,
    });
  }

  // Drain the queue now (non-blocking). pg_cron catches anything missed.
  kickWorker();

  // Best-effort emails (confirmation to the customer; sale alert once).
  sendOrderConfirmation(created[0].id).catch(err => console.error("order confirmation email failed:", err));
  sendFounderSaleAlert(created[0].id).catch(err => console.error("sale alert email failed:", err));

  // Founder gamification — reward the brand owner.
  if (brand.user_id) {
    awardXP(brand.user_id, "order_received", { order_id: created[0].id, brand_id: brand.id })
      .catch(err => console.error("awardXP order_received failed:", err));
    checkRevenueMilestones(brand.user_id, brand.id)
      .catch(err => console.error("checkRevenueMilestones failed:", err));
  }

  const response = { id: created[0].id, count: created.length };

  // Persist idempotent response.
  if (idempotencyKey) {
    await svc.from("idempotency_keys").insert({
      key: idempotencyKey, scope: "checkout", response,
    }).then(undefined, () => { /* race: another request stored it first */ });
  }

  return NextResponse.json(response);
}
