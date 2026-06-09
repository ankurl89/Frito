/**
 * Printrove adapter — STUB.
 *
 * Exists to prove the adapter seam: a second provider drops in by implementing
 * the same FulfillmentProvider interface, with no changes to the Commerce Core,
 * Fulfillment Engine, queue, or state machine. Wire in the real Printrove API
 * (token auth, /external/orders) when a merchant selects this provider.
 *
 * Runs in sandbox mode until PRINTROVE_TOKEN is configured.
 */

import {
  FulfillmentProvider, ProviderCapabilities, SubmitOrderInput, SubmitOrderResult,
  TrackingInfo, CanonicalEvent,
} from "../types";
import { OrderState } from "@/lib/orders/states";

const STATUS_MAP: Record<string, OrderState> = {
  "created": "submitted_to_provider",
  "in_production": "in_production",
  "ready_to_dispatch": "packed",
  "shipped": "shipped",
  "delivered": "delivered",
  "cancelled": "cancelled",
};

export class PrintroveAdapter implements FulfillmentProvider {
  readonly name = "printrove";

  private get sandbox(): boolean {
    return !process.env.PRINTROVE_TOKEN;
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
    // Sandbox-only for now.
    return {
      providerOrderId: `pr_sandbox_${input.orderId.slice(0, 8)}`,
      raw: { sandbox: true, message: "Simulated Printrove submission" },
      sandbox: true,
    };
  }

  async getTracking(_providerOrderId: string): Promise<TrackingInfo> {
    return { raw: { sandbox: true } };
  }

  async cancelOrder(_providerOrderId: string): Promise<void> {
    /* no-op in stub */
  }

  normalizeWebhook(payload: unknown): CanonicalEvent | null {
    const p = payload as Record<string, unknown>;
    const providerOrderId = String(p.order_id || p.reference || "");
    const statusRaw = String(p.status || "").toLowerCase();
    const toState = STATUS_MAP[statusRaw];
    if (!providerOrderId || !toState) return null;
    return {
      providerOrderId,
      toState,
      trackingNumber: p.tracking_number as string | undefined,
      courier: p.courier as string | undefined,
      raw: payload,
    };
  }

  verifyWebhook(_headers: Record<string, string>, _rawBody: string): boolean {
    return true;
  }
}
