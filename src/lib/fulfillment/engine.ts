/**
 * Fulfillment Engine — orchestrates provider submission, tracking sync, and
 * cancellation. The ONLY module that talks to provider adapters.
 *
 * Everything is idempotent and driven by the job queue, so a provider outage
 * results in retries (1m→5m→15m→1h→24h) and finally a dead-letter — never a
 * lost order.
 */

import { createServiceClient } from "@/lib/supabase/service";
import { getProvider } from "./registry";
import { FulfillmentLineItem, FulfillmentAddress } from "./types";
import { transition } from "@/lib/orders/state-machine";
import { enqueue } from "@/lib/queue/job-queue";
import { OrderState } from "@/lib/orders/states";

/** Sandbox progression: which state follows which, and how long to wait. */
const SANDBOX_FLOW: { from: OrderState; to: OrderState; delaySeconds: number }[] = [
  { from: "submitted_to_provider", to: "in_production", delaySeconds: 20 },
  { from: "in_production",          to: "packed",        delaySeconds: 20 },
  { from: "packed",                 to: "shipped",       delaySeconds: 20 },
  { from: "shipped",                to: "delivered",     delaySeconds: 30 },
];

/**
 * Submit an order to its fulfillment provider.
 * Idempotent: if a provider_order_id already exists, it's a no-op.
 */
export async function submitOrder(orderId: string): Promise<void> {
  const supabase = createServiceClient();

  // Load order + its single product (orders are 1 product : 1 order).
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (!order) throw new Error(`Order ${orderId} not found`);

  // Terminal? Nothing to do.
  if (["cancelled", "refunded", "delivered"].includes(order.status)) return;

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", order.product_id)
    .single();
  if (!product) throw new Error(`Product for order ${orderId} not found`);

  const providerName = product.fulfillment_provider || "qikink";
  const provider = getProvider(providerName);

  // Idempotency guard: already submitted?
  const { data: existing } = await supabase
    .from("fulfillment_orders")
    .select("*")
    .eq("order_id", orderId)
    .eq("provider", providerName)
    .maybeSingle();
  if (existing?.provider_order_id) {
    return; // already submitted — idempotent no-op
  }

  const variant = (order.variant || {}) as { size?: string; color?: string; price?: number };
  const placement = (product.placement || {}) as { key?: string };
  const quantity = order.quantity || 1;
  const unitPrice = variant.price ?? product.sell_price ?? 0;

  // Print-quality gate: a LIVE order must carry the print-ready production
  // file (WYSIWYG-rendered at print DPI). Submitting raw artwork — or nothing —
  // would print wrong or blank. Throwing here sends the job through
  // retry → dead-letter, where it's visible in Mission Control instead of
  // silently producing a bad garment. (Sandbox submissions skip the gate so
  // test flows keep working.)
  const printFileUrl: string | undefined = product.production_file_url || undefined;
  if (!provider.getCapabilities().sandbox && !printFileUrl) {
    throw new Error(
      `Product ${product.id} has no production file — open its artwork editor and save to regenerate, then retry this order.`
    );
  }

  const items: FulfillmentLineItem[] = [{
    catalogProductId: product.qikink_product_id || product.sku,
    productName: product.name,
    size: variant.size,
    color: variant.color,
    placementKey: placement.key,
    quantity,
    price: unitPrice,
    printFileUrl: printFileUrl || product.artwork_url,   // sandbox may fall back
    mockupUrl: product.mockup_url,
  }];

  const addr = order.shipping_address as FulfillmentAddress;

  // Submit (idempotency key = order id → provider dedupes retries).
  const result = await provider.submitOrder({
    orderId,
    items,
    shippingAddress: addr,
    customer: { name: order.customer_name, email: order.customer_email, phone: order.customer_phone },
    totalOrderValue: order.total_amount ?? unitPrice * quantity,
    idempotencyKey: orderId,
  });

  // Persist the provider linkage.
  await supabase.from("fulfillment_orders").upsert({
    order_id: orderId,
    provider: providerName,
    provider_order_id: result.providerOrderId,
    status: "submitted",
    request_payload: { items },
    response_payload: result.raw as Record<string, unknown>,
    sandbox: result.sandbox ?? false,
    updated_at: new Date().toISOString(),
  }, { onConflict: "order_id,provider" });

  await transition(orderId, "submitted_to_provider", {
    event: "submitted_to_provider",
    actor: `provider:${providerName}`,
    metadata: { provider_order_id: result.providerOrderId, sandbox: result.sandbox },
  });

  // Sandbox providers have no real webhooks → simulate the progression.
  if (result.sandbox) {
    await enqueue({
      type: "order.simulate_advance",
      payload: { orderId },
      idempotencyKey: `sim:${orderId}:in_production`,
      delaySeconds: SANDBOX_FLOW[0].delaySeconds,
    });
  }
}

/**
 * Sandbox-only: advance an order one stage and enqueue the next.
 * Real providers drive this via webhooks instead.
 */
export async function simulateAdvance(orderId: string): Promise<void> {
  const supabase = createServiceClient();
  const { data: order } = await supabase.from("orders").select("status").eq("id", orderId).single();
  if (!order) return;

  const step = SANDBOX_FLOW.find(s => s.from === order.status);
  if (!step) return; // nothing left to simulate (delivered or off-path)

  const res = await transition(orderId, step.to, {
    event: "sandbox_simulation",
    actor: "system",
    metadata: { simulated: true },
  });

  // Attach fake tracking when we hit "shipped".
  if (step.to === "shipped") {
    await supabase
      .from("orders")
      .update({ tracking_number: `SANDBOX${orderId.slice(0, 6).toUpperCase()}`, courier: "Delhivery" })
      .eq("id", orderId);
  }

  // Queue the next hop.
  const next = SANDBOX_FLOW.find(s => s.from === step.to);
  if (res.ok && next) {
    await enqueue({
      type: "order.simulate_advance",
      payload: { orderId },
      idempotencyKey: `sim:${orderId}:${next.to}`,
      delaySeconds: next.delaySeconds,
    });
  }
}

/** Poll a provider for tracking and apply any state change. */
export async function syncTracking(orderId: string): Promise<void> {
  const supabase = createServiceClient();
  const { data: fo } = await supabase
    .from("fulfillment_orders")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  if (!fo?.provider_order_id) return;

  const provider = getProvider(fo.provider);
  const tracking = await provider.getTracking(fo.provider_order_id);

  if (tracking.trackingNumber || tracking.courier) {
    await supabase.from("fulfillment_orders").update({
      tracking_number: tracking.trackingNumber,
      courier: tracking.courier,
      tracking_url: tracking.trackingUrl,
      updated_at: new Date().toISOString(),
    }).eq("id", fo.id);
    await supabase.from("orders").update({
      tracking_number: tracking.trackingNumber,
      courier: tracking.courier,
    }).eq("id", orderId);
  }

  if (tracking.state) {
    await transition(orderId, tracking.state, {
      event: "tracking_sync",
      actor: `provider:${fo.provider}`,
      metadata: { tracking },
    });
  }
}
