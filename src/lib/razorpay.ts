/**
 * Razorpay helper — order creation + payment signature verification.
 *
 * No SDK dependency: order creation is a single authenticated REST call and
 * signature verification is an HMAC, both done with built-ins. Test vs live is
 * determined entirely by the key prefix (rzp_test_ / rzp_live_) — same endpoint.
 *
 * Keys are read from the environment and never sent to the client. The public
 * Key Id is surfaced to the browser only via the create-payment endpoint.
 */

import crypto from "crypto";

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

/** Whether live/test keys are present. When false, checkout falls back to simulation. */
export function razorpayConfigured(): boolean {
  return Boolean(KEY_ID && KEY_SECRET);
}

/** Public Key Id, safe to expose to the browser. */
export function razorpayKeyId(): string | null {
  return KEY_ID ?? null;
}

interface CreateOrderInput {
  amountPaise: number;                 // amount in paise (₹1 = 100)
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export async function createRazorpayOrder({ amountPaise, receipt, notes }: CreateOrderInput): Promise<RazorpayOrder> {
  if (!KEY_ID || !KEY_SECRET) throw new Error("Razorpay is not configured");
  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes: notes ?? {} }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.description || "Failed to create payment order");
  }
  return data as RazorpayOrder;
}

/**
 * Verify the checkout callback signature. Razorpay signs `${orderId}|${paymentId}`
 * with the key secret (HMAC-SHA256). A matching signature proves the payment is
 * genuine and tied to the order we created — the gate before fulfilling.
 */
export function verifyRazorpaySignature({
  orderId, paymentId, signature,
}: { orderId: string; paymentId: string; signature: string }): boolean {
  if (!KEY_SECRET || !orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false; // length mismatch → not equal
  }
}

/** Whether a webhook secret is configured (set in the Razorpay dashboard + env). */
export function razorpayWebhookConfigured(): boolean {
  return Boolean(WEBHOOK_SECRET);
}

/**
 * Verify a Razorpay webhook. Razorpay signs the RAW request body with the
 * webhook secret (separate from the API key secret) and sends it as the
 * `x-razorpay-signature` header. Must be called with the unparsed body.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
