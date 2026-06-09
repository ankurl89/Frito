"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCart, useCartHydrated } from "@/lib/cart-store";
import { Plus, Minus, X, ShoppingBag, Loader2 } from "lucide-react";

export default function CartPage() {
  const { slug } = useParams<{ slug: string }>();
  const hydrated = useCartHydrated();
  const items = useCart(s => s.items);
  const setQuantity = useCart(s => s.setQuantity);
  const remove = useCart(s => s.remove);

  const cartItems = items.filter(i => i.brand_slug === slug);
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = cartItems.length > 0 ? 49 : 0;
  const total = subtotal + shipping;

  if (!hydrated) {
    return (
      <div style={{ backgroundColor: "var(--brand-bg)", color: "var(--brand-text)" }}>
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <Loader2 size={20} className="animate-spin mx-auto opacity-40" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--brand-bg)", color: "var(--brand-text)" }}>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8" style={{ fontFamily: "var(--brand-headline-font)" }}>Your bag</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--brand-text) 6%, transparent)" }}>
              <ShoppingBag size={22} className="opacity-50" />
            </div>
            <p className="font-mono text-[10px] tracking-widest opacity-60 mb-3">YOUR BAG IS EMPTY</p>
            <Link href={`/store/${slug}/collection/all`} className="inline-flex px-6 py-3 rounded-full font-bold" style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-fg)" }}>
              Browse the collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              {cartItems.map(item => (
                <div key={`${item.product_id}-${item.size}`} className="bg-white rounded-2xl p-4 flex gap-4 border" style={{ borderColor: "color-mix(in srgb, var(--brand-text) 10%, transparent)" }}>
                  <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: "color-mix(in srgb, var(--brand-text) 6%, transparent)" }}>
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{item.name}</p>
                    {item.size && <p className="text-xs opacity-60 mt-0.5">Size {item.size}</p>}
                    <p className="font-black mt-1">₹{item.price.toLocaleString("en-IN")}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="inline-flex items-center border rounded-lg" style={{ borderColor: "color-mix(in srgb, var(--brand-text) 20%, transparent)" }}>
                        <button onClick={() => setQuantity(item.product_id, item.size, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:opacity-70">
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                        <button onClick={() => setQuantity(item.product_id, item.size, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:opacity-70">
                          <Plus size={12} />
                        </button>
                      </div>
                      <button onClick={() => remove(item.product_id, item.size)} className="text-xs opacity-50 hover:opacity-100 flex items-center gap-1">
                        <X size={11} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div>
              <div className="bg-white rounded-2xl p-6 border sticky top-24" style={{ borderColor: "color-mix(in srgb, var(--brand-text) 10%, transparent)" }}>
                <p className="font-mono text-[10px] tracking-widest opacity-60 mb-4">ORDER SUMMARY</p>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="opacity-70">Subtotal</span>
                    <span className="font-bold">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Shipping</span>
                    <span className="font-bold">₹{shipping}</span>
                  </div>
                  <div className="border-t pt-2.5 mt-2.5 flex justify-between" style={{ borderColor: "color-mix(in srgb, var(--brand-text) 10%, transparent)" }}>
                    <span className="font-bold">Total</span>
                    <span className="font-black text-xl">₹{total.toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <Link
                  href={`/store/${slug}/checkout`}
                  className="block w-full mt-5 py-3.5 rounded-full font-bold text-center"
                  style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-fg)" }}
                >
                  Checkout →
                </Link>
                <p className="text-xs opacity-60 text-center mt-3">Secure checkout · Razorpay</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
