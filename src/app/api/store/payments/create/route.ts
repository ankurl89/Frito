import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId } from "@/lib/razorpay";
import { recordCreation } from "@/lib/orders/state-machine";
import { guardIp } from "@/lib/guardrails/guard";

/**
 * POST /api/store/payments/create — start a payment for the current cart.
 *
 * Re-prices the cart from the source of truth, creates a Razorpay order, and
 * pre-creates our order row(s) as `pending_payment` linked to the Razorpay
 * order id (`payment_order_ref`). The order existing BEFORE payment is what
 * lets the webhook complete it even if the customer's browser drops after pay.
 *
 * If no keys are configured, returns `{ simulated: true }` and the browser uses
 * the legacy simulated path (/api/store/orders) — keeps every env working.
 */

const SHIPPING = 49; // flat, matches the cart/checkout UI

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (!(await guardIp(ip, "payment_create", 20))) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const { brand_slug, customer_name, customer_email, customer_phone, shipping_address, items } = await req.json();
  if (!brand_slug || !items?.length) {
    return NextResponse.json({ error: "Missing cart details" }, { status: 400 });
  }

  // No keys → tell the client to use the simulated path (unchanged behavior).
  if (!razorpayConfigured()) {
    return NextResponse.json({ simulated: true });
  }

  if (!customer_name || !shipping_address) {
    return NextResponse.json({ error: "Missing customer details" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data: brand } = await svc.from("brands").select("id, name").eq("slug", brand_slug).single();
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  // Authoritative pricing from the catalog (never trust client amounts).
  const productIds = items.map((i: { product_id: string }) => i.product_id);
  const { data: products } = await svc.from("products").select("id, base_cost, sell_price").in("id", productIds);
  const productMap = new Map((products || []).map(p => [p.id, p]));

  let subtotal = 0;
  const lineRows = (items as { product_id: string; size?: string; color?: string; quantity: number; price?: number }[]).map(item => {
    const prod = productMap.get(item.product_id);
    const sellPrice = (prod?.sell_price as number | undefined) ?? item.price ?? 0;
    const baseCost = (prod?.base_cost as number | undefined) ?? 0;
    const totalAmount = sellPrice * item.quantity;
    subtotal += totalAmount;
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
      cost_amount: baseCost * item.quantity,
      profit_amount: totalAmount - baseCost * item.quantity,
      status: "pending_payment",
    };
  });

  if (subtotal <= 0) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });

  const amountPaise = Math.round((subtotal + SHIPPING) * 100);

  // 1. Razorpay order.
  let rzpOrderId: string;
  try {
    const order = await createRazorpayOrder({
      amountPaise,
      receipt: `frito_${Date.now()}`,
      notes: { brand_slug },
    });
    rzpOrderId = order.id;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start payment" },
      { status: 502 }
    );
  }

  // 2. Pre-create our orders as pending_payment, linked to the Razorpay order.
  const { data: created, error } = await svc
    .from("orders")
    .insert(lineRows.map(r => ({ ...r, payment_order_ref: rzpOrderId })))
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  for (const o of created || []) {
    await recordCreation(o.id, "pending_payment", "customer", { brand_slug, razorpayOrderId: rzpOrderId });
  }

  return NextResponse.json({
    razorpayOrderId: rzpOrderId,
    amount: amountPaise,
    currency: "INR",
    keyId: razorpayKeyId(),
    brandName: brand.name,
  });
}
