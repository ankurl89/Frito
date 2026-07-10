/**
 * Qikink fulfillment adapter.
 *
 * Implements the real Qikink Order API shape. When QIKINK_CLIENT_ID /
 * QIKINK_API_TOKEN are absent, it runs in SANDBOX mode: submissions return a
 * simulated provider order id and the engine drives a simulated status
 * progression. This keeps the entire pipeline exercisable end-to-end without
 * live credentials — and the real integration is a drop-in (flip the env vars).
 */

import {
  FulfillmentProvider, ProviderCapabilities, SubmitOrderInput, SubmitOrderResult,
  TrackingInfo, CanonicalEvent,
} from "../types";
import { OrderState } from "@/lib/orders/states";
import { QIKINK_BASE, isQikinkSandbox, qikinkAuthHeaders, clearQikinkTokenCache } from "./qikink-auth";
import {
  resolveQikinkSku, resolveQikinkPlacement, resolveQikinkPrintTypeId, isQikinkCatalogMapped,
  resolvePrintDimensionsInches,
} from "../qikink-sku";

// Qikink status string → canonical order state. Covers both production statuses
// and post-dispatch shipping statuses. VERIFY exact strings against the sandbox.
const STATUS_MAP: Record<string, OrderState> = {
  "on hold": "submitted_to_provider",        // new order, awaiting confirmation (seen in sandbox)
  "order confirmed": "submitted_to_provider",
  "confirmed": "submitted_to_provider",
  "in production": "in_production",
  "printing": "in_production",
  "ready to ship": "packed",
  "packed": "packed",
  "order picked up": "shipped",
  "in-transit": "shipped",
  "in transit": "shipped",
  "shipped": "shipped",
  "out for delivery": "shipped",
  "delivered": "delivered",
  "cancelled": "cancelled",
  "rto": "failed",
  "rto initiated": "failed",
  "rto (return to origin) initiated": "failed",
};

export class QikinkAdapter implements FulfillmentProvider {
  readonly name = "qikink";

  private get sandbox(): boolean {
    return isQikinkSandbox();
  }

  getCapabilities(): ProviderCapabilities {
    return {
      supportsCancel: true,
      supportsTrackingPolling: true,
      supportsWebhooks: true,
      sandbox: this.sandbox,
    };
  }

  async submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
    if (this.sandbox) {
      // Simulated submission — deterministic fake id derived from order id.
      return {
        providerOrderId: `qk_sandbox_${input.orderId.slice(0, 8)}`,
        raw: { sandbox: true, message: "Simulated Qikink submission" },
        sandbox: true,
      };
    }

    // Guard: never submit a live order with an unmapped catalog (would send a
    // garbage SKU). Fail loudly so the job retries/dead-letters instead.
    if (!isQikinkCatalogMapped()) {
      throw new Error("Qikink catalog is not mapped yet — fill GARMENT_CODE/COLOR_CODE in qikink-sku.ts");
    }

    // Real Qikink Create Order call. Resolve each line to a real Qikink SKU,
    // placement_sku, and print type from our neutral catalog identifiers.
    // Payload shape mirrors the documented Qikink "Create Order" request.
    const [firstName, ...restName] = (input.shippingAddress.name || "").trim().split(/\s+/);
    // Qikink caps order_number at 15 chars; our ids are UUIDs. Derive a stable
    // ≤15-char reference (deterministic → idempotent resubmits dedupe correctly).
    const orderNumber = input.orderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 15);
    const body = {
      order_number: orderNumber,
      qikink_shipping: "1",
      gateway: "Prepaid",                       // Frito collects payment online
      total_order_value: String(input.totalOrderValue ?? 0),
      line_items: input.items.map(i => ({
        search_from_my_products: 0,
        quantity: String(i.quantity),
        print_type_id: resolveQikinkPrintTypeId(i.catalogProductId),
        price: String(i.price ?? 0),
        sku: resolveQikinkSku(i.catalogProductId, i.color || "", i.size || ""),
        designs: i.printFileUrl
          ? [{
              design_code: `frito-${resolveQikinkPlacement(i.placementKey)}`,
              placement_sku: resolveQikinkPlacement(i.placementKey),
              // Pin the physical print size to the previewed print area (WYSIWYG).
              ...resolvePrintDimensionsInches(i.catalogProductId, i.placementKey),
              design_link: i.printFileUrl,
              mockup_link: i.mockupUrl || "",
            }]
          : [],
      })),
      shipping_address: {
        first_name: firstName || input.shippingAddress.name,
        last_name: restName.join(" "),
        address1: input.shippingAddress.line1,
        address2: input.shippingAddress.line2 || "",
        phone: input.shippingAddress.phone || input.customer.phone || "",
        email: input.customer.email,
        city: input.shippingAddress.city,
        province: input.shippingAddress.state,
        zip: input.shippingAddress.pincode,
        country_code: "IN",
      },
    };

    const submit = async () => fetch(`${QIKINK_BASE}/api/order/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Idempotency: Qikink dedupes on order_number, so resubmits are safe.
        "Idempotency-Key": input.idempotencyKey,
        ...(await qikinkAuthHeaders()),
      },
      body: JSON.stringify(body),
    });

    let res = await submit();
    // A stale cached token → 401. Clear it and retry once with a fresh token.
    if (res.status === 401) {
      clearQikinkTokenCache();
      res = await submit();
    }

    const raw = await res.json();
    if (!res.ok) throw new Error(`Qikink submit failed (${res.status}): ${JSON.stringify(raw).slice(0, 200)}`);

    const providerOrderId = raw.order_id || raw.id || raw.qikink_order_id;
    if (!providerOrderId) throw new Error("Qikink did not return an order id");
    return { providerOrderId: String(providerOrderId), raw };
  }

  async getTracking(providerOrderId: string): Promise<TrackingInfo> {
    if (this.sandbox) return { raw: { sandbox: true } };
    // Single order is GET /api/order?id={id} (query param, not a path segment).
    const res = await fetch(`${QIKINK_BASE}/api/order?id=${encodeURIComponent(providerOrderId)}`, {
      headers: await qikinkAuthHeaders(),
    });
    const raw = await res.json();
    // Endpoint may return the order object or a single-element array.
    const order = Array.isArray(raw) ? raw[0] : raw;
    const shipping = order?.shipping || {};
    const status = String(order?.status || "").toLowerCase();
    return {
      state: STATUS_MAP[status],
      trackingNumber: shipping.awb ? String(shipping.awb) : undefined,
      courier: shipping.courier_provider_name || undefined,
      trackingUrl: shipping.tracking_link,
      raw,
    };
  }

  async cancelOrder(providerOrderId: string): Promise<void> {
    if (this.sandbox) return;
    // NOTE: Qikink's documented API exposes no cancel endpoint (token, order/create,
    // order list, order?id only). Post-submission cancellation may be support-only.
    // This best-effort call is VERIFY — confirm the real path or remove.
    await fetch(`${QIKINK_BASE}/api/order/cancel/${providerOrderId}`, {
      method: "POST",
      headers: await qikinkAuthHeaders(),
    });
  }

  normalizeWebhook(payload: unknown): CanonicalEvent | null {
    const p = payload as Record<string, unknown>;
    const providerOrderId = String(p.order_id || p.qikink_order_id || p.production_id || "");
    const statusRaw = String(p.order_status || p.status || "").toLowerCase();
    if (!providerOrderId || !statusRaw) return null;

    const toState = STATUS_MAP[statusRaw];
    if (!toState) return null;

    return {
      providerOrderId,
      toState,
      trackingNumber: (p.awb || p.tracking_number || p.tracking_id) as string | undefined,
      courier: p.courier as string | undefined,
      trackingUrl: (p.tracking_link || p.tracking_url) as string | undefined,
      raw: payload,
    };
  }

  verifyWebhook(headers: Record<string, string>, _rawBody: string): boolean {
    const secret = process.env.QIKINK_WEBHOOK_SECRET;
    if (!secret) return true; // no secret configured → accept (dev)
    const provided = headers["x-qikink-signature"] || headers["x-webhook-secret"];
    return provided === secret;
  }
}
