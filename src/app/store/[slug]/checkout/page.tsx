"use client";

/**
 * Customer checkout — 3 steps: Address → Payment → Processing.
 *
 * The cart store is persisted in localStorage. On first render the store
 * is empty (zustand persist hasn't loaded yet), so we guard with
 * useCartHydrated() to prevent flashing "your bag is empty".
 *
 * Form inputs use brand-bg + brand-text styling so they always read
 * on any brand palette.
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart, useCartHydrated } from "@/lib/cart-store";
import { Loader2, Check, ShieldCheck, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

type Step = "address" | "payment" | "processing";

const STEPS: { key: Step; label: string }[] = [
  { key: "address", label: "Address" },
  { key: "payment", label: "Payment" },
];

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const hydrated = useCartHydrated();
  const allItems = useCart(s => s.items);

  const items = allItems.filter(i => i.brand_slug === slug);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = items.length > 0 ? 49 : 0;
  const total = subtotal + shipping;

  const [step, setStep] = useState<Step>("address");
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    line1: "", line2: "", city: "", state: "", pincode: "",
  });
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function placeOrder() {
    setStep("processing");
    setError(null);
    try {
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_slug: slug,
          customer_name: form.name,
          customer_email: form.email,
          customer_phone: form.phone,
          shipping_address: {
            line1: form.line1, line2: form.line2,
            city: form.city, state: form.state,
            pincode: form.pincode, country: "India",
          },
          items: items.map(i => ({
            product_id: i.product_id,
            size: i.size,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      useCart.getState().clear();
      router.push(`/store/${slug}/order/${data.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Checkout failed";
      setError(msg);
      setStep("payment");
    }
  }

  // ── Hydration loading state ─────────────────────────────
  if (!hydrated) {
    return (
      <div style={{ backgroundColor: "var(--brand-bg)", color: "var(--brand-text)" }}>
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <Loader2 size={20} className="animate-spin mx-auto opacity-40" />
        </div>
      </div>
    );
  }

  // ── Empty cart ─────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div style={{ backgroundColor: "var(--brand-bg)", color: "var(--brand-text)" }}>
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="font-mono text-[10px] tracking-widest opacity-60 mb-3">YOUR BAG IS EMPTY</p>
          <p className="text-sm opacity-70 mb-6">Add something before checking out.</p>
          <Link
            href={`/store/${slug}/collection/all`}
            className="inline-flex px-6 py-3 rounded-full font-bold"
            style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-fg)" }}
          >
            Browse the collection
          </Link>
        </div>
      </div>
    );
  }

  const stepIdx = STEPS.findIndex(s => s.key === step);

  return (
    <div style={{ backgroundColor: "var(--brand-bg)", color: "var(--brand-text)" }}>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-black tracking-tight mb-2" style={{ fontFamily: "var(--brand-headline-font)" }}>
          Checkout
        </h1>
        <p className="text-sm opacity-60 mb-8 flex items-center gap-1.5">
          <Lock size={11} /> Secure checkout · 256-bit encrypted
        </p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const done = stepIdx > i || step === "processing";
            const active = step === s.key;
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] font-bold"
                  style={
                    done   ? { backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-fg)" } :
                    active ? { backgroundColor: "var(--brand-text)",    color: "var(--brand-bg)" } :
                             { backgroundColor: "color-mix(in srgb, var(--brand-text) 10%, transparent)" }
                  }
                >
                  {done ? <Check size={11} /> : i + 1}
                </div>
                <span className={`font-mono text-[10px] tracking-widest ${active || done ? "font-bold" : "opacity-50"}`}>
                  {s.label.toUpperCase()}
                </span>
                {i < STEPS.length - 1 && (
                  <div className="w-12 h-px ml-1" style={{ backgroundColor: "color-mix(in srgb, var(--brand-text) 20%, transparent)" }} />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT — form column */}
          <div className="lg:col-span-2">

            {/* ── Address step ── */}
            {step === "address" && (
              <Card>
                <Label>SHIPPING ADDRESS</Label>
                <form
                  onSubmit={(e) => { e.preventDefault(); setStep("payment"); }}
                  className="space-y-4 mt-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input label="Full name" value={form.name} onChange={v => update("name", v)} required autoComplete="name" />
                    <Input label="Email" type="email" value={form.email} onChange={v => update("email", v)} required autoComplete="email" />
                  </div>
                  <Input label="Phone" type="tel" value={form.phone} onChange={v => update("phone", v)} required autoComplete="tel" />
                  <Input label="Address line 1" value={form.line1} onChange={v => update("line1", v)} required autoComplete="address-line1" />
                  <Input label="Apartment, suite, etc. (optional)" value={form.line2} onChange={v => update("line2", v)} autoComplete="address-line2" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input label="City" value={form.city} onChange={v => update("city", v)} required autoComplete="address-level2" />
                    <Input label="State" value={form.state} onChange={v => update("state", v)} required autoComplete="address-level1" />
                    <Input label="PIN code" value={form.pincode} onChange={v => update("pincode", v)} required autoComplete="postal-code" inputMode="numeric" />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3.5 rounded-full font-bold flex items-center justify-center gap-2"
                    style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-fg)" }}
                  >
                    Continue to payment <ArrowRight size={15} />
                  </button>
                </form>
              </Card>
            )}

            {/* ── Payment step ── */}
            {step === "payment" && (
              <Card>
                <Label>PAYMENT METHOD</Label>

                <div className="mt-4 space-y-3">
                  <div
                    className="border-2 rounded-xl p-4 flex items-center gap-3"
                    style={{ borderColor: "var(--brand-primary)" }}
                  >
                    <ShieldCheck size={18} style={{ color: "var(--brand-primary)" }} />
                    <div className="flex-1">
                      <p className="font-bold text-sm">Razorpay Secure Checkout</p>
                      <p className="text-xs opacity-60 mt-0.5">Cards · UPI · Net Banking · Wallets</p>
                    </div>
                    <Check size={16} style={{ color: "var(--brand-primary)" }} />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
                    <span className="font-bold">Demo mode:</span> payment will be simulated and your order created instantly. In production this launches the Razorpay payment widget.
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                      {error}
                    </div>
                  )}
                </div>

                <button
                  onClick={placeOrder}
                  className="w-full mt-5 py-3.5 rounded-full font-bold flex items-center justify-center gap-2"
                  style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-fg)" }}
                >
                  Pay ₹{total.toLocaleString("en-IN")} <ArrowRight size={15} />
                </button>
                <button
                  onClick={() => setStep("address")}
                  className="w-full py-2 mt-1 text-xs opacity-60 hover:opacity-100 transition-opacity"
                >
                  ← Back to address
                </button>
              </Card>
            )}

            {/* ── Processing ── */}
            {step === "processing" && (
              <Card>
                <div className="py-10 text-center">
                  <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: "var(--brand-primary)" }} />
                  <p className="font-bold">Placing your order…</p>
                  <p className="text-xs opacity-60 mt-1">Just a moment</p>
                </div>
              </Card>
            )}
          </div>

          {/* RIGHT — order summary */}
          <aside>
            <Card sticky>
              <Label>{items.length} {items.length === 1 ? "ITEM" : "ITEMS"}</Label>
              <div className="space-y-3 mt-3 mb-4">
                {items.map(item => (
                  <div key={`${item.product_id}-${item.size}`} className="flex gap-3 items-start">
                    <div
                      className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 relative"
                      style={{ backgroundColor: "color-mix(in srgb, var(--brand-text) 6%, transparent)" }}
                    >
                      {item.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                      )}
                      <span
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center"
                        style={{ backgroundColor: "var(--brand-text)", color: "var(--brand-bg)" }}
                      >
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs leading-snug line-clamp-2">{item.name}</p>
                      {item.size && <p className="text-[10px] opacity-60 mt-0.5">Size {item.size}</p>}
                    </div>
                    <p className="font-bold text-xs whitespace-nowrap">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>

              <div
                className="border-t pt-3 space-y-2 text-sm"
                style={{ borderColor: "color-mix(in srgb, var(--brand-text) 10%, transparent)" }}
              >
                <Row label="Subtotal" value={`₹${subtotal.toLocaleString("en-IN")}`} />
                <Row label="Shipping" value={`₹${shipping}`} />
                <Row label="Taxes" value="Included" muted />
                <div
                  className="flex justify-between font-black pt-3 mt-2 border-t text-base"
                  style={{ borderColor: "color-mix(in srgb, var(--brand-text) 10%, transparent)" }}
                >
                  <span>Total</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────── */

function Card({ children, sticky }: { children: React.ReactNode; sticky?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-6 border ${sticky ? "lg:sticky lg:top-24" : ""}`}
      style={{
        backgroundColor: "color-mix(in srgb, var(--brand-text) 2%, var(--brand-bg))",
        borderColor: "color-mix(in srgb, var(--brand-text) 12%, transparent)",
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] tracking-widest opacity-60">{children}</p>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "opacity-50" : "opacity-80"}`}>
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

interface InputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
}

function Input({ label, value, onChange, type = "text", required, autoComplete, inputMode }: InputProps) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] tracking-widest opacity-60 mb-1.5">{label.toUpperCase()}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
        style={{
          backgroundColor: "var(--brand-bg)",
          color: "var(--brand-text)",
          border: "1px solid color-mix(in srgb, var(--brand-text) 18%, transparent)",
        }}
      />
    </label>
  );
}
