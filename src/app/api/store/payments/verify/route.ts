import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { captureRazorpayPayment } from "@/lib/payments/capture";

/**
 * POST /api/store/payments/verify — browser callback after a successful pay.
 *
 * Verifies the checkout signature, then captures the payment (marks the
 * pre-created order paid + queues fulfillment). Idempotent and safe to race
 * with the webhook. Returns the order id so checkout can redirect to tracking.
 */
export async function POST(req: NextRequest) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  const verified = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!verified) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  const result = await captureRazorpayPayment(razorpay_order_id, razorpay_payment_id, "customer");
  if (!result.ok || result.orderIds.length === 0) {
    return NextResponse.json({ error: "No order found for this payment" }, { status: 404 });
  }

  return NextResponse.json({ id: result.orderIds[0], count: result.orderIds.length });
}
