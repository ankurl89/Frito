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

const QIKINK_BASE = "https://api.qikink.com/api";

// Qikink status string → canonical order state.
const STATUS_MAP: Record<string, OrderState> = {
  "order confirmed": "submitted_to_provider",
  "confirmed": "submitted_to_provider",
  "in production": "in_production",
  "printing": "in_production",
  "ready to ship": "packed",
  "packed": "packed",
  "shipped": "shipped",
  "out for delivery": "shipped",
  "delivered": "delivered",
  "cancelled": "cancelled",
  "rto": "failed",
};

export class QikinkAdapter implements FulfillmentProvider {
  readonly name = "qikink";

  private get sandbox(): boolean {
    return !process.env.QIKINK_CLIENT_ID || !process.env.QIKINK_API_TOKEN;
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

    // Real Qikink Create Order call.
    const body = {
      order_number: input.orderId,
      qikink_shipping: "1",
      gateway: "Prepaid",
      line_items: input.items.map(i => ({
        search_from_my_products: 0,
        quantity: String(i.quantity),
        print_type_id: 1,
        price: "0",
        sku: i.providerSku,
        designs: i.printFileUrl ? [{ design_link: i.printFileUrl, mockup_link: i.mockupUrl }] : [],
      })),
      shipping_address: {
        first_name: input.shippingAddress.name,
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

    const res = await fetch(`${QIKINK_BASE}/order/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ClientId: process.env.QIKINK_CLIENT_ID!,
        Accesstoken: process.env.QIKINK_API_TOKEN!,
        // Idempotency: Qikink dedupes on order_number, so resubmits are safe.
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify(body),
    });

    const raw = await res.json();
    if (!res.ok) throw new Error(`Qikink submit failed (${res.status}): ${JSON.stringify(raw).slice(0, 200)}`);

    const providerOrderId = raw.order_id || raw.id || raw.qikink_order_id;
    if (!providerOrderId) throw new Error("Qikink did not return an order id");
    return { providerOrderId: String(providerOrderId), raw };
  }

  async getTracking(providerOrderId: string): Promise<TrackingInfo> {
    if (this.sandbox) return { raw: { sandbox: true } };
    const res = await fetch(`${QIKINK_BASE}/order/${providerOrderId}`, {
      headers: {
        ClientId: process.env.QIKINK_CLIENT_ID!,
        Accesstoken: process.env.QIKINK_API_TOKEN!,
      },
    });
    const raw = await res.json();
    const status = String(raw.order_status || raw.status || "").toLowerCase();
    return {
      state: STATUS_MAP[status],
      trackingNumber: raw.awb || raw.tracking_id,
      courier: raw.courier,
      trackingUrl: raw.tracking_link,
      raw,
    };
  }

  async cancelOrder(providerOrderId: string): Promise<void> {
    if (this.sandbox) return;
    await fetch(`${QIKINK_BASE}/order/cancel/${providerOrderId}`, {
      method: "POST",
      headers: {
        ClientId: process.env.QIKINK_CLIENT_ID!,
        Accesstoken: process.env.QIKINK_API_TOKEN!,
      },
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
