"use client";

/**
 * Upgrade / plans page. Reachable from the brand-limit wall and the sidebar.
 * Shows the user's current plan + brand usage and the available tiers.
 *
 * Billing isn't automated yet, so the CTA for a higher tier opens a prefilled
 * email to the team — actionable, not a dead end.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2 } from "lucide-react";

type PlanKey = "free" | "growth" | "scale";

interface Usage { plan: PlanKey; brands: number; limit: number; atLimit: boolean }

const PLANS: { key: PlanKey; name: string; price: string; desc: string; features: string[]; highlight?: boolean }[] = [
  {
    key: "free", name: "Starter", price: "₹0", desc: "Launch your first brand and prove it.",
    features: ["1 brand", "AI brand + 10 designs/mo", "Platform-hosted store", "Pay-as-you-fulfill"],
  },
  {
    key: "growth", name: "Growth", price: "₹2,499", desc: "For founders running multiple brands.", highlight: true,
    features: ["3 brands", "Unlimited AI designs", "Custom domain + themes", "Priority fulfillment", "Growth insights"],
  },
  {
    key: "scale", name: "Scale", price: "₹9,999", desc: "Unlimited brands, maximum throughput.",
    features: ["Unlimited brands", "Highest AI limits", "Everything in Growth", "Dedicated support"],
  },
];

const ORDER: PlanKey[] = ["free", "growth", "scale"];

export default function UpgradePage() {
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    fetch("/api/account/usage").then(r => r.json()).then(setUsage).catch(() => setUsage(null));
  }, []);

  const currentIdx = usage ? ORDER.indexOf(usage.plan) : -1;

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <div className="bg-white border-b border-zinc-200 px-8 py-5 flex items-center gap-4">
        <Link href="/dashboard" className="w-9 h-9 border border-zinc-200 rounded-xl flex items-center justify-center hover:bg-zinc-50 transition-colors">
          <ArrowLeft size={15} className="text-zinc-600" />
        </Link>
        <div>
          <h1 className="font-black text-zinc-900 text-lg tracking-tight">Plans & Upgrade</h1>
          <p className="font-mono text-[10px] tracking-widest text-zinc-400">SCALE WHEN YOU SELL</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Current usage banner */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 mb-8 flex items-center justify-between flex-wrap gap-3">
          {!usage ? (
            <span className="flex items-center gap-2 text-zinc-500 text-sm"><Loader2 size={14} className="animate-spin" /> Loading your plan…</span>
          ) : (
            <>
              <div>
                <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-1">YOUR PLAN</p>
                <p className="font-black text-zinc-900 text-lg capitalize">
                  {PLANS.find(p => p.key === usage.plan)?.name || usage.plan}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-1">BRANDS</p>
                <p className={`font-black text-lg ${usage.atLimit ? "text-amber-600" : "text-zinc-900"}`}>
                  {usage.brands} / {usage.limit >= 9999 ? "∞" : usage.limit}
                </p>
              </div>
            </>
          )}
        </div>

        {usage?.atLimit && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-sm text-amber-800">
            You&apos;ve reached your plan&apos;s brand limit. Upgrade to create more brands.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const isCurrent = usage?.plan === plan.key;
            const planIdx = ORDER.indexOf(plan.key);
            const isUpgrade = currentIdx >= 0 && planIdx > currentIdx;
            return (
              <div
                key={plan.key}
                className={`rounded-2xl p-7 flex flex-col ${plan.highlight ? "bg-zinc-900 text-white shadow-xl" : "bg-white border border-zinc-200"}`}
              >
                {isCurrent && <p className={`text-[10px] font-black tracking-widest mb-3 ${plan.highlight ? "text-violet-400" : "text-violet-600"}`}>YOUR PLAN</p>}
                {!isCurrent && plan.highlight && <p className="text-[10px] font-black tracking-widest text-violet-400 mb-3">MOST POPULAR</p>}
                <p className={`font-bold mb-1 ${plan.highlight ? "text-zinc-400" : "text-zinc-600"}`}>{plan.name}</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className={`text-sm mb-1 ${plan.highlight ? "text-zinc-400" : "text-zinc-400"}`}>/mo</span>
                </div>
                <p className={`text-sm mb-5 ${plan.highlight ? "text-zinc-400" : "text-zinc-500"}`}>{plan.desc}</p>
                <div className="space-y-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <div key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? "text-zinc-300" : "text-zinc-600"}`}>
                      <Check size={14} className={plan.highlight ? "text-violet-400" : "text-green-500"} /> {f}
                    </div>
                  ))}
                </div>
                {isCurrent ? (
                  <div className={`text-center font-semibold py-3 rounded-xl ${plan.highlight ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-400"}`}>
                    Current plan
                  </div>
                ) : isUpgrade ? (
                  <a
                    href={`mailto:ankur.rocks89@gmail.com?subject=${encodeURIComponent(`Upgrade to ${plan.name}`)}&body=${encodeURIComponent(`Hi Frito team, I'd like to upgrade my account to the ${plan.name} plan.`)}`}
                    className={`text-center font-semibold py-3 rounded-xl transition-colors ${plan.highlight ? "bg-violet-600 text-white hover:bg-violet-500" : "border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-50"}`}
                  >
                    Upgrade to {plan.name}
                  </a>
                ) : (
                  <div className="text-center font-semibold py-3 rounded-xl border-2 border-zinc-100 text-zinc-300">
                    —
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-zinc-400 text-xs mt-8">
          Billing isn&apos;t automated yet — upgrades are handled by our team within a day of you reaching out.
        </p>
      </div>
    </div>
  );
}
