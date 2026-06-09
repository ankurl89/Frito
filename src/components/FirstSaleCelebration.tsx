"use client";

/**
 * First-sale celebration — full-screen overlay shown once per founder,
 * when the `first_sale` achievement is first detected.
 *
 * State is persisted in localStorage so it doesn't show on every reload.
 */

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface FirstSaleData {
  revenue: number;
  product_name: string;
  customer_location?: string;
}

export default function FirstSaleCelebration() {
  const [data, setData] = useState<FirstSaleData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // Already dismissed? Skip.
      if (localStorage.getItem("first_sale_celebrated") === "1") return;

      const res = await fetch("/api/founder/me");
      if (!res.ok) return;
      const snapshot = await res.json();
      const hasFirstSale = snapshot.achievements?.some((a: { achievement_key: string }) => a.achievement_key === "first_sale");
      if (!hasFirstSale) return;

      // Fetch first order details for the celebration screen.
      // We need a real order; pull from any brand.
      const brandsRes = await fetch("/api/brands");
      const brands = await brandsRes.json();
      if (!brands?.length) return;
      const ordersRes = await fetch(`/api/founder/first-order`);
      if (!ordersRes.ok) return;
      const order = await ordersRes.json();
      if (cancelled || !order?.id) return;
      setData({
        revenue: order.total_amount || 0,
        product_name: order.product_name || "your product",
        customer_location: order.customer_city,
      });
    }

    check();
    return () => { cancelled = true; };
  }, []);

  function dismiss() {
    localStorage.setItem("first_sale_celebrated", "1");
    setData(null);
  }

  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-gradient-to-br from-violet-600 via-violet-700 to-zinc-900 rounded-3xl max-w-lg w-full p-10 text-white text-center relative overflow-hidden">
        {/* Confetti dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
                backgroundColor: ["#fbbf24", "#ec4899", "#22d3ee", "#a78bfa", "#34d399"][i % 5],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <button onClick={dismiss} className="absolute top-4 right-4 w-9 h-9 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center">
          <X size={16} />
        </button>

        <div className="relative">
          <p className="text-7xl mb-4">🎉</p>
          <p className="font-mono text-[10px] tracking-widest text-violet-300 mb-2">FIRST SALE</p>
          <h2 className="text-4xl font-black tracking-tight mb-3">You did it.</h2>
          <p className="text-violet-200 mb-6">Someone, somewhere, just paid for something you made.</p>

          <div className="bg-white/10 rounded-2xl p-5 mb-6">
            <p className="text-5xl font-black mb-1">₹{data.revenue.toLocaleString("en-IN")}</p>
            <p className="text-violet-200 text-sm">first revenue earned</p>
            <p className="text-xs text-violet-300 mt-2">on &ldquo;{data.product_name}&rdquo;</p>
            {data.customer_location && (
              <p className="text-xs text-violet-300">to a customer in {data.customer_location}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                const text = encodeURIComponent(`Just made my first sale on Frito AI 🚀 — built and launched a brand in minutes. ₹${data.revenue.toLocaleString("en-IN")} earned on day one.`);
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&summary=${text}`, "_blank");
              }}
              className="w-full bg-white text-violet-700 font-black py-3 rounded-xl hover:bg-violet-50 transition-colors"
            >
              Share on LinkedIn
            </button>
            <button
              onClick={dismiss}
              className="w-full text-violet-300 hover:text-white font-medium py-2 transition-colors text-sm"
            >
              Keep building →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
