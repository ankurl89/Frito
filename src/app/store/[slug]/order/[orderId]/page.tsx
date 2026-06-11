/**
 * Customer Order Tracking — completely hides Qikink and any backend complexity.
 *
 * Shows a 5-step status pipeline:
 *   Order Received → In Production → Packed → Shipped → Delivered
 *
 * Internal `pending`/`confirmed` map to "Order Received".
 * `in_production` → "In Production".
 * `ready_to_ship` → "Packed".
 * `shipped` → "Shipped".
 * `delivered` → "Delivered".
 */

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, Package, Truck, MapPin, ClipboardCheck } from "lucide-react";

import { customerStageIndex } from "@/lib/orders/states";

const STAGES = [
  { key: "received",    label: "Order Received", icon: ClipboardCheck },
  { key: "production",  label: "In Production",  icon: Package },
  { key: "packed",      label: "Packed",         icon: Package },
  { key: "shipped",     label: "Shipped",        icon: Truck },
  { key: "delivered",   label: "Delivered",      icon: MapPin },
];

export default async function OrderTrackingPage({ params }: { params: Promise<{ slug: string; orderId: string }> }) {
  const { slug, orderId } = await params;
  const supabase = await createClient();

  const { data: brand } = await supabase.from("brands").select("*").eq("slug", slug).single();
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!brand || !order) notFound();

  const currentStage = customerStageIndex(order.status);
  const isCancelled = order.status === "cancelled" || order.status === "refunded";

  return (
    <div style={{ backgroundColor: "var(--brand-bg)", color: "var(--brand-text)" }}>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <p className="font-mono text-[11px] tracking-widest opacity-60 mb-3">ORDER #{order.id.slice(0, 8).toUpperCase()}</p>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2" style={{ fontFamily: "var(--brand-headline-font)" }}>
          Thanks for your order
        </h1>
        <p className="opacity-70 mb-10">We&apos;ve sent a confirmation to <span className="font-bold">{order.customer_email}</span>.</p>

        {/* Status pipeline */}
        <div className="rounded-2xl p-8 border mb-6" style={{ backgroundColor: "var(--brand-surface)", borderColor: "color-mix(in srgb, var(--brand-text) 10%, transparent)" }}>
          <p className="font-mono text-[10px] tracking-widest opacity-60 mb-6">STATUS</p>
          {isCancelled ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="font-bold text-red-900">Order cancelled</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-3.5 top-3 bottom-3 w-0.5" style={{ backgroundColor: "color-mix(in srgb, var(--brand-text) 10%, transparent)" }} />
              <div className="space-y-5">
                {STAGES.map((stage, idx) => {
                  const done = idx < currentStage;
                  const active = idx === currentStage;
                  const StageIcon = stage.icon;
                  return (
                    <div key={stage.key} className="flex items-start gap-4 relative">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10`}
                        style={done ? { backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-fg)" } :
                                active ? { backgroundColor: "var(--brand-text)", color: "var(--brand-bg)" } :
                                          { backgroundColor: "color-mix(in srgb, var(--brand-text) 8%, transparent)" }}>
                        {done ? <Check size={13} /> : <StageIcon size={13} className={active ? "" : "opacity-50"} />}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className={`font-bold ${done || active ? "" : "opacity-50"}`}>{stage.label}</p>
                        {active && order.tracking_number && stage.key === "shipped" && (
                          <p className="text-xs opacity-70 mt-1">Tracking: <span className="font-mono">{order.tracking_number}</span> ({order.courier})</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="rounded-2xl p-6 border" style={{ backgroundColor: "var(--brand-surface)", borderColor: "color-mix(in srgb, var(--brand-text) 10%, transparent)" }}>
          <p className="font-mono text-[10px] tracking-widest opacity-60 mb-4">ORDER SUMMARY</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="opacity-70">Subtotal</span>
              <span className="font-bold">₹{order.total_amount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between font-black pt-2 border-t" style={{ borderColor: "color-mix(in srgb, var(--brand-text) 10%, transparent)" }}>
              <span>Total paid</span>
              <span>₹{order.total_amount.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t" style={{ borderColor: "color-mix(in srgb, var(--brand-text) 10%, transparent)" }}>
            <p className="font-mono text-[10px] tracking-widest opacity-60 mb-2">SHIPPING TO</p>
            <p className="text-sm">{order.customer_name}</p>
            <p className="text-xs opacity-70">{(order.shipping_address as Record<string, string>)?.line1}</p>
            <p className="text-xs opacity-70">
              {(order.shipping_address as Record<string, string>)?.city}, {(order.shipping_address as Record<string, string>)?.state} {(order.shipping_address as Record<string, string>)?.pincode}
            </p>
          </div>
        </div>

        <Link href={`/store/${slug}`} className="mt-8 inline-flex items-center gap-2 font-bold hover:opacity-70 transition-opacity">
          ← Continue shopping at {brand.name}
        </Link>
      </div>
    </div>
  );
}
