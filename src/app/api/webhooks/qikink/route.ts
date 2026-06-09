import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getProvider } from "@/lib/fulfillment/registry";
import { transition } from "@/lib/orders/state-machine";

/**
 * Qikink fulfillment webhook — now provider-agnostic in structure.
 *
 * The handler does NOT know Qikink's status vocabulary. It:
 *   1. verifies the webhook signature via the adapter
 *   2. normalizes the payload to a canonical event via the adapter
 *   3. resolves the platform order from provider_order_id
 *   4. applies the transition through the state machine (audited, idempotent)
 *
 * Swapping or adding a provider needs no change here.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => { headers[k] = v; });

    const provider = getProvider("qikink");

    // 1. Verify authenticity.
    if (!provider.verifyWebhook(headers, rawBody)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Normalize to canonical event.
    const payload = JSON.parse(rawBody || "{}");
    const event = provider.normalizeWebhook(payload);
    if (!event) {
      return NextResponse.json({ ignored: true });   // unrecognized status — ack
    }

    // 3. Resolve platform order.
    const svc = createServiceClient();
    const { data: fo } = await svc
      .from("fulfillment_orders")
      .select("order_id")
      .eq("provider", "qikink")
      .eq("provider_order_id", event.providerOrderId)
      .maybeSingle();

    if (!fo) {
      // Unknown provider order — ack so the provider stops retrying.
      return NextResponse.json({ ignored: true, reason: "order not found" });
    }

    // 4. Persist tracking + transition (idempotent for out-of-order delivery).
    if (event.trackingNumber || event.courier) {
      await svc.from("fulfillment_orders").update({
        tracking_number: event.trackingNumber,
        courier: event.courier,
        tracking_url: event.trackingUrl,
        updated_at: new Date().toISOString(),
      }).eq("order_id", fo.order_id).eq("provider", "qikink");

      await svc.from("orders").update({
        tracking_number: event.trackingNumber,
        courier: event.courier,
      }).eq("id", fo.order_id);
    }

    await transition(fo.order_id, event.toState, {
      event: "provider_webhook",
      actor: "provider:qikink",
      metadata: { raw: event.raw },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Qikink webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
