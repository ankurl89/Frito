import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, razorpayWebhookConfigured } from "@/lib/razorpay";
import { captureRazorpayPayment } from "@/lib/payments/capture";

/**
 * POST /api/webhooks/razorpay — server-to-server payment notification.
 *
 * The safety net: if a customer pays but their browser drops before the
 * callback, Razorpay still notifies us here and we complete the order. The
 * capture is idempotent, so a webhook that races the browser is harmless.
 *
 * Signature is verified against the RAW body using the webhook secret (set in
 * the Razorpay dashboard + RAZORPAY_WEBHOOK_SECRET). Always 200 on handled or
 * ignored events so Razorpay doesn't retry needlessly; 400 only on bad signature.
 */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  // If no secret is configured (e.g. before setup), don't pretend to process.
  if (!razorpayWebhookConfigured()) {
    console.warn("[razorpay-webhook] received but RAZORPAY_WEBHOOK_SECRET not set — ignoring");
    return NextResponse.json({ received: false }, { status: 200 });
  }

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string } };
      order?: { entity?: { id?: string } };
    };
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // We act on a captured payment / paid order. Both carry the Razorpay order id
  // + payment id we need to find and complete our pre-created order.
  if (body.event === "payment.captured" || body.event === "order.paid") {
    const payment = body.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id || body.payload?.order?.entity?.id;
    const paymentId = payment?.id;

    if (razorpayOrderId && paymentId) {
      try {
        await captureRazorpayPayment(razorpayOrderId, paymentId, "webhook:razorpay");
      } catch (err) {
        console.error("[razorpay-webhook] capture failed:", err);
        // 500 → Razorpay retries, which is what we want on a transient failure.
        return NextResponse.json({ error: "Capture failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
