"use client";

/**
 * Track Order — customer self-serve lookup. Requires order reference + the
 * email used at checkout (both, so orders can't be enumerated by email alone),
 * then redirects to the order's tracking page.
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, PackageSearch } from "lucide-react";

export default function TrackOrderPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/store/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_slug: slug, email, reference }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      router.push(`/store/${slug}/order/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
      setLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: "var(--brand-bg)", color: "var(--brand-text)" }}>
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: "color-mix(in srgb, var(--brand-primary) 12%, transparent)" }}>
          <PackageSearch size={22} style={{ color: "var(--brand-primary)" }} />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-center mb-2" style={{ fontFamily: "var(--brand-headline-font)" }}>
          Track your order
        </h1>
        <p className="text-sm opacity-70 text-center mb-8">
          Enter your order number (like <span className="font-mono font-bold">AB12CD34</span>) and the email you ordered with.
        </p>

        <form onSubmit={lookup} className="space-y-4">
          <label className="block">
            <span className="block font-mono text-[10px] tracking-widest opacity-60 mb-1.5">ORDER NUMBER</span>
            <input
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="AB12CD34"
              required
              className="w-full px-4 py-3 rounded-xl text-sm font-mono focus:outline-none focus:ring-2"
              style={{ backgroundColor: "var(--brand-bg)", color: "var(--brand-text)", border: "1px solid color-mix(in srgb, var(--brand-text) 18%, transparent)" }}
            />
          </label>
          <label className="block">
            <span className="block font-mono text-[10px] tracking-widest opacity-60 mb-1.5">EMAIL</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{ backgroundColor: "var(--brand-bg)", color: "var(--brand-text)", border: "1px solid color-mix(in srgb, var(--brand-text) 18%, transparent)" }}
            />
          </label>

          {error && (
            <p className="text-xs bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-fg)" }}
          >
            {loading ? <><Loader2 size={15} className="animate-spin" /> Finding your order…</> : "Track order"}
          </button>
        </form>

        <p className="text-[11px] opacity-50 text-center mt-6">
          Your order number is on your confirmation page and email.
        </p>
      </div>
    </div>
  );
}
