/**
 * Order notifications — the emails that make a store feel real.
 *
 *   customer: order confirmation (on payment) + shipped (with tracking)
 *   founder:  "you made a sale" alert
 *
 * All best-effort and fire-and-forget: a failed email never fails an order.
 * Loads its own data via the service client so callers only pass an orderId.
 */

import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email";
import { subdomainUrl } from "@/lib/domains";

interface OrderContext {
  order: {
    id: string; customer_name: string; customer_email: string;
    total_amount: number; quantity: number; tracking_number?: string | null; courier?: string | null;
    variant?: { size?: string; color?: string } | null;
  };
  brandName: string;
  brandSlug: string | null;
  productName: string;
  ownerEmail: string | null;
}

async function loadOrderContext(orderId: string): Promise<OrderContext | null> {
  const svc = createServiceClient();
  const { data: order } = await svc
    .from("orders")
    .select("id, customer_name, customer_email, total_amount, quantity, tracking_number, courier, variant, brands(name, slug, user_id), products(name)")
    .eq("id", orderId)
    .single();
  if (!order) return null;

  const brand = (order as unknown as { brands: { name: string; slug: string | null; user_id: string } | null }).brands;
  const product = (order as unknown as { products: { name: string } | null }).products;

  let ownerEmail: string | null = null;
  if (brand?.user_id) {
    try {
      const { data } = await svc.auth.admin.getUserById(brand.user_id);
      ownerEmail = data?.user?.email ?? null;
    } catch { /* best-effort */ }
  }

  return {
    order: order as unknown as OrderContext["order"],
    brandName: brand?.name || "your store",
    brandSlug: brand?.slug ?? null,
    productName: product?.name || "your item",
    ownerEmail,
  };
}

function orderUrl(ctx: OrderContext): string {
  const path = `/store/${ctx.brandSlug}/order/${ctx.order.id}`;
  const sub = ctx.brandSlug ? subdomainUrl(ctx.brandSlug) : null;
  if (sub) return `${sub}/order/${ctx.order.id}`;
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://frito-psi.vercel.app";
  return `${base}${path}`;
}

const ref = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;
const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/** Shared minimal, mail-client-safe shell. */
function shell(title: string, bodyHtml: string, footer: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#18181b">
  <h2 style="margin:0 0 16px;font-size:20px">${title}</h2>
  ${bodyHtml}
  <p style="color:#a1a1aa;font-size:12px;margin-top:28px">${footer}</p>
</div>`;
}

function itemLine(ctx: OrderContext): string {
  const v = ctx.order.variant || {};
  const detail = [v.color, v.size && `Size ${v.size}`, `Qty ${ctx.order.quantity || 1}`].filter(Boolean).join(" · ");
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr>
      <td style="padding:12px;background:#fafafa;border-radius:8px">
        <strong>${ctx.productName}</strong><br>
        <span style="color:#71717a;font-size:13px">${detail}</span>
      </td>
      <td style="padding:12px;background:#fafafa;text-align:right;white-space:nowrap"><strong>${inr(ctx.order.total_amount)}</strong></td>
    </tr>
  </table>`;
}

/** Customer: payment confirmed, order in production. */
export async function sendOrderConfirmation(orderId: string): Promise<void> {
  const ctx = await loadOrderContext(orderId);
  if (!ctx?.order.customer_email) return;

  await sendEmail({
    to: ctx.order.customer_email,
    subject: `Order confirmed ${ref(ctx.order.id)} — ${ctx.brandName}`,
    html: shell(
      `Thanks for your order, ${ctx.order.customer_name?.split(" ")[0] || "there"}!`,
      `<p>Your order <strong>${ref(ctx.order.id)}</strong> from <strong>${ctx.brandName}</strong> is confirmed and heading into production.</p>
       ${itemLine(ctx)}
       <p><a href="${orderUrl(ctx)}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px">Track your order</a></p>
       <p style="color:#71717a;font-size:13px">Each piece is made to order — production takes 2–5 business days before it ships.</p>`,
      `${ctx.brandName} · powered by Frito`
    ),
  });
}

/** Customer: order shipped, with tracking when available. */
export async function sendOrderShipped(orderId: string): Promise<void> {
  const ctx = await loadOrderContext(orderId);
  if (!ctx?.order.customer_email) return;

  const tracking = ctx.order.tracking_number
    ? `<p>Tracking: <strong>${ctx.order.tracking_number}</strong>${ctx.order.courier ? ` (${ctx.order.courier})` : ""}</p>`
    : "";

  await sendEmail({
    to: ctx.order.customer_email,
    subject: `Your order is on its way ${ref(ctx.order.id)} — ${ctx.brandName}`,
    html: shell(
      "Your order has shipped! 📦",
      `<p>Order <strong>${ref(ctx.order.id)}</strong> from <strong>${ctx.brandName}</strong> is on its way to you.</p>
       ${tracking}
       ${itemLine(ctx)}
       <p><a href="${orderUrl(ctx)}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px">Track delivery</a></p>`,
      `${ctx.brandName} · powered by Frito`
    ),
  });
}

/** Founder: you made a sale. */
export async function sendFounderSaleAlert(orderId: string): Promise<void> {
  const ctx = await loadOrderContext(orderId);
  if (!ctx?.ownerEmail) return;

  const base = process.env.NEXT_PUBLIC_APP_URL || "https://frito-psi.vercel.app";
  await sendEmail({
    to: ctx.ownerEmail,
    subject: `🎉 You made a sale — ${inr(ctx.order.total_amount)} at ${ctx.brandName}`,
    html: shell(
      "You made a sale! 🎉",
      `<p><strong>${ctx.brandName}</strong> just sold <strong>${ctx.productName}</strong> for <strong>${inr(ctx.order.total_amount)}</strong> (order ${ref(ctx.order.id)}).</p>
       <p>Production and shipping are handled automatically — nothing you need to do.</p>
       <p><a href="${base}/dashboard" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px">Open your dashboard</a></p>`,
      "Frito · your brand, on autopilot"
    ),
  });
}
