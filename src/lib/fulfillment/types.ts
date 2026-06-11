/**
 * Fulfillment provider contract.
 *
 * Every provider (Qikink, Printrove, future manufacturing partners) implements
 * this interface. The Commerce Core only ever speaks this language — provider
 * APIs, auth schemes, and status vocabularies are sealed inside each adapter.
 *
 * Adding a provider = writing one class. Nothing else in the platform changes.
 */

import { OrderState } from "@/lib/orders/states";

export interface FulfillmentAddress {
  name: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface FulfillmentLineItem {
  /** OUR catalog product id (e.g. "QK-001"). Each adapter maps it to its own SKU. */
  catalogProductId: string;
  productName: string;
  size?: string;
  /** Garment color name (Black/White/Beige/Navy). */
  color?: string;
  /** Named print placement (front_center / back_center / front_pocket / full_back). */
  placementKey?: string;
  quantity: number;
  /** Print-ready production file URL. */
  printFileUrl?: string;
  /** Mockup for provider reference. */
  mockupUrl?: string;
}

export interface SubmitOrderInput {
  orderId: string;
  items: FulfillmentLineItem[];
  shippingAddress: FulfillmentAddress;
  customer: { name: string; email: string; phone?: string };
  /** Idempotency key the adapter should pass to the provider if supported. */
  idempotencyKey: string;
}

export interface SubmitOrderResult {
  providerOrderId: string;
  raw: unknown;            // raw provider response, stored for audit
  sandbox?: boolean;       // true if simulated (no real provider call)
}

export interface TrackingInfo {
  state?: OrderState;
  trackingNumber?: string;
  courier?: string;
  trackingUrl?: string;
  raw?: unknown;
}

/** Normalised webhook event — provider status mapped onto a canonical state. */
export interface CanonicalEvent {
  providerOrderId: string;
  toState: OrderState;
  trackingNumber?: string;
  courier?: string;
  trackingUrl?: string;
  raw: unknown;
}

export interface ProviderCapabilities {
  supportsCancel: boolean;
  supportsTrackingPolling: boolean;
  supportsWebhooks: boolean;
  /** Running without real credentials — submissions are simulated. */
  sandbox: boolean;
}

export interface FulfillmentProvider {
  readonly name: string;
  getCapabilities(): ProviderCapabilities;
  submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult>;
  getTracking(providerOrderId: string): Promise<TrackingInfo>;
  cancelOrder(providerOrderId: string): Promise<void>;
  /** Map a raw provider webhook payload onto a canonical event (or null to ignore). */
  normalizeWebhook(payload: unknown): CanonicalEvent | null;
  /** Verify a webhook signature/secret. Returns true if authentic. */
  verifyWebhook(headers: Record<string, string>, rawBody: string): boolean;
}
