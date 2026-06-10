"use client";

/**
 * Onboarding Workshop — a guided brand-building experience, not a form.
 *
 * Arc:
 *   1. DREAM     — pick a direction from visual cards (kills blank-page anxiety)
 *   2. DESCRIBE  — one sentence, with example prompts for inspiration
 *   3. BUILDING  — AI agents work (momentum + anticipation)
 *   4. REVEAL    — "Meet your brand" — a celebratory product-launch moment
 *   5. LAUNCH    — confirm + launch plan with clear next steps
 *
 * A single rich generation (/api/ai/onboard) powers steps 3-5 so the founder
 * sees a complete brand in seconds. Logo + Brand Book generate in the
 * background after launch.
 */

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BrandDNA } from "@/lib/types";
import toast from "react-hot-toast";
import {
  ArrowRight, Sparkles, Loader2, Check, TrendingUp, Target,
  Zap, Package, Store, Trophy,
} from "lucide-react";

type Stage = "dream" | "describe" | "building" | "reveal" | "launch";

interface OnboardResult extends Partial<BrandDNA> {
  interpretation?: string;
  opportunity?: { demand: string; competition: string; trend: string; positioning: string };
  recommended_products?: { name: string; why: string; margin: string; popularity: string; difficulty: string }[];
}

const NICHES = [
  { key: "Streetwear", emoji: "🧥", example: "Bold streetwear that turns heads" },
  { key: "Fitness", emoji: "💪", example: "Apparel for people who train with intent" },
  { key: "Anime", emoji: "⛩️", example: "Premium anime gear, not childish fan merch" },
  { key: "Luxury", emoji: "💎", example: "Quiet luxury for people who know" },
  { key: "Gaming", emoji: "🎮", example: "Merch for a gaming community" },
  { key: "Pets", emoji: "🐾", example: "For people obsessed with their pets" },
  { key: "Coffee", emoji: "☕", example: "A coffee brand with a point of view" },
  { key: "Creator Merch", emoji: "🎬", example: "Drops for my audience" },
  { key: "Sustainability", emoji: "🌱", example: "Sustainable goods that look good" },
  { key: "Custom Idea", emoji: "✨", example: "Something entirely my own" },
];

const STAGE_INDEX: Record<Stage, number> = { dream: 0, describe: 1, building: 2, reveal: 3, launch: 4 };

export default function OnboardingWorkshop() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("dream");
  const [niches, setNiches] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<OnboardResult | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const brandIdRef = useRef<string | null>(null);

  const toggleNiche = (key: string) =>
    setNiches(n => (n.includes(key) ? n.filter(x => x !== key) : [...n, key]));

  async function generate() {
    setStage("building");
    try {
      const res = await fetch("/api/ai/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niches, description }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Generation failed");
      setResult(data);

      // Fire logo generation in the background — shown in the reveal if ready.
      fetch("/api/ai/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName: data.name, logoPrompt: data.logo_prompt, palette: data.palette }),
      }).then(r => r.json()).then(({ url }) => url && setLogoUrl(url)).catch(() => {});

      // Let the build animation breathe, then reveal.
      setTimeout(() => setStage("reveal"), 2600);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setStage("describe");
    }
  }

  async function launch() {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.name, tagline: result.tagline, story: result.story,
          niche: result.niche, target_audience: result.target_audience,
          brand_values: result.brand_values, voice_tone: result.voice_tone,
          price_tier: result.price_tier, palette: result.palette,
          typography: result.typography, logo_prompt: result.logo_prompt,
          logo_url: logoUrl, status: "active",
        }),
      });
      const brand = await res.json();
      if (brand.error) throw new Error(brand.error);
      brandIdRef.current = brand.id;

      // Background: full Brand Book.
      fetch("/api/ai/brand-book", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: brand.id }),
      }).catch(() => {});

      setStage("launch");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to launch");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Ambient gradient */}
      <div className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: "radial-gradient(800px circle at 50% -10%, #4c1d95 0%, transparent 60%)" }} />

      {/* Momentum meter */}
      {stage !== "launch" && (
        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-black tracking-tight text-lg">FRITO<span className="text-violet-500">.</span></span>
            <span className="font-mono text-[10px] tracking-widest text-zinc-500">
              FOUNDER · LEVEL 1 · DREAMER
            </span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-1 bg-gradient-to-r from-violet-500 to-yellow-300"
              animate={{ width: `${(STAGE_INDEX[stage] / 4) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {stage === "dream" && (
            <DreamStage key="dream" niches={niches} toggle={toggleNiche} onNext={() => setStage("describe")} />
          )}
          {stage === "describe" && (
            <DescribeStage key="describe" niches={niches} description={description}
              setDescription={setDescription} onBack={() => setStage("dream")} onNext={generate} />
          )}
          {stage === "building" && <BuildingStage key="building" />}
          {stage === "reveal" && result && (
            <RevealStage key="reveal" result={result} logoUrl={logoUrl} saving={saving} onLaunch={launch} />
          )}
          {stage === "launch" && result && (
            <LaunchStage key="launch" result={result} brandId={brandIdRef.current}
              onProduct={() => router.push(`/dashboard/${brandIdRef.current}/products/new`)}
              onDashboard={() => router.push(`/dashboard/${brandIdRef.current}`)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── STEP 1: DREAM ─────────────────────────────────────────── */
function DreamStage({ niches, toggle, onNext }: { niches: string[]; toggle: (k: string) => void; onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto px-6 pt-16 pb-24"
    >
      <p className="font-mono text-[11px] tracking-widest text-violet-400 mb-3">/ THE DREAM /</p>
      <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
        What kind of brand do you want to build?
      </h1>
      <p className="text-zinc-400 mb-10">Pick what excites you. You can choose more than one — this just gives us a direction.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {NICHES.map((n, i) => {
          const active = niches.includes(n.key);
          return (
            <motion.button
              key={n.key}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => toggle(n.key)}
              className={`text-left p-4 rounded-2xl border transition-all ${
                active ? "border-violet-500 bg-violet-500/10" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">{n.emoji}</span>
                {active && <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center"><Check size={12} /></div>}
              </div>
              <p className="font-bold text-sm">{n.key}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{n.example}</p>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-10 flex justify-end">
        <button
          onClick={onNext}
          disabled={niches.length === 0}
          className="inline-flex items-center gap-2 bg-violet-600 text-white font-bold px-7 py-3.5 rounded-full hover:bg-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}

/* ── STEP 2: DESCRIBE ──────────────────────────────────────── */
function DescribeStage({ niches, description, setDescription, onBack, onNext }: {
  niches: string[]; description: string; setDescription: (s: string) => void; onBack: () => void; onNext: () => void;
}) {
  const examples = NICHES.filter(n => niches.includes(n.key)).map(n => n.example).slice(0, 3);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto px-6 pt-20 pb-24"
    >
      <p className="font-mono text-[11px] tracking-widest text-violet-400 mb-3">/ THE IDEA /</p>
      <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
        Tell me about it in one sentence.
      </h1>
      <p className="text-zinc-400 mb-8">Don&apos;t overthink it. Just the gist — I&apos;ll do the heavy lifting.</p>

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        autoFocus
        rows={3}
        placeholder="e.g. anime apparel that doesn't look childish"
        className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none placeholder:text-zinc-600"
      />

      {examples.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[10px] tracking-widest text-zinc-500 mb-2">NEED A SPARK?</p>
          <div className="flex flex-wrap gap-2">
            {examples.map(ex => (
              <button key={ex} onClick={() => setDescription(ex)}
                className="text-xs text-zinc-300 bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700 rounded-full px-3 py-1.5 transition-colors">
                &ldquo;{ex}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex items-center justify-between">
        <button onClick={onBack} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">← Back</button>
        <button
          onClick={onNext}
          disabled={!description.trim()}
          className="inline-flex items-center gap-2 bg-violet-600 text-white font-bold px-7 py-3.5 rounded-full hover:bg-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles size={16} /> Build my brand
        </button>
      </div>
    </motion.div>
  );
}

/* ── STEP 3: BUILDING ──────────────────────────────────────── */
function BuildingStage() {
  const steps = [
    "Studying your market…",
    "Naming your brand…",
    "Designing your identity…",
    "Writing your story…",
    "Finding your products…",
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="max-w-xl mx-auto px-6 pt-32 pb-24 text-center"
    >
      <motion.div
        animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-violet-500 to-yellow-400 flex items-center justify-center"
      >
        <Sparkles size={32} className="text-white" />
      </motion.div>
      <h2 className="text-2xl font-black tracking-tight mb-8">Your founding team is on it</h2>
      <div className="space-y-3 text-left max-w-xs mx-auto">
        {steps.map((s, i) => (
          <motion.div key={s} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.45 }}
            className="flex items-center gap-3">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.45 + 0.3 }}
              className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
              <Check size={11} />
            </motion.div>
            <span className="text-sm text-zinc-300">{s}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── STEP 4: REVEAL ────────────────────────────────────────── */
function RevealStage({ result, logoUrl, saving, onLaunch }: {
  result: OnboardResult; logoUrl: string | null; saving: boolean; onLaunch: () => void;
}) {
  const palette = (result.palette || {}) as Record<string, string>;
  const primary = palette.primary || "#7c3aed";
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto px-6 pt-12 pb-28"
    >
      {/* Interpretation */}
      {result.interpretation && (
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-center text-zinc-400 italic mb-8 text-lg">
          &ldquo;{result.interpretation}&rdquo;
        </motion.p>
      )}

      {/* Hero brand reveal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 16, delay: 0.2 }}
        className="rounded-3xl overflow-hidden border border-zinc-800 mb-6"
      >
        <div className="h-2 flex">
          {Object.values(palette).slice(0, 5).map((c, i) => <div key={i} className="flex-1" style={{ backgroundColor: c }} />)}
        </div>
        <div className="p-8 bg-zinc-900/80 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.4 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl font-black overflow-hidden"
            style={{ backgroundColor: primary }}
          >
            {logoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={logoUrl} alt={result.name} className="w-full h-full object-contain" />
              : <span className="text-white">{result.name?.[0]}</span>}
          </motion.div>
          <p className="font-mono text-[10px] tracking-widest text-zinc-500 mb-2">MEET YOUR BRAND</p>
          <h1 className="text-5xl font-black tracking-tight mb-2">{result.name}</h1>
          <p className="text-zinc-400 italic">&ldquo;{result.tagline}&rdquo;</p>
        </div>
      </motion.div>

      {/* Identity grid */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <InfoCard label="STORY" wide>{result.story}</InfoCard>
        <InfoCard label="AUDIENCE">{result.target_audience}</InfoCard>
        <InfoCard label="VOICE">{result.voice_tone}</InfoCard>
        <InfoCard label="VALUES">
          <span className="flex flex-wrap gap-1.5">
            {(result.brand_values || []).map(v => (
              <span key={v} className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full">{v}</span>
            ))}
          </span>
        </InfoCard>
        <InfoCard label="PALETTE">
          <span className="flex gap-1.5">
            {Object.values(palette).map((c, i) => <span key={i} className="w-6 h-6 rounded-full border border-zinc-700" style={{ backgroundColor: c }} />)}
          </span>
        </InfoCard>
      </motion.div>

      {/* Opportunity */}
      {result.opportunity && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-green-400" />
            <p className="font-mono text-[10px] tracking-widest text-zinc-500">BRAND OPPORTUNITY</p>
          </div>
          <div className="space-y-3 text-sm">
            <OppRow icon={<Zap size={13} className="text-yellow-400" />} label="Demand" text={result.opportunity.demand} />
            <OppRow icon={<Target size={13} className="text-blue-400" />} label="Competition" text={result.opportunity.competition} />
            <OppRow icon={<TrendingUp size={13} className="text-green-400" />} label="Trend" text={result.opportunity.trend} />
            <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-3 mt-3">
              <p className="font-mono text-[9px] tracking-widest text-violet-400 mb-1">YOUR WINNING ANGLE</p>
              <p className="text-zinc-200">{result.opportunity.positioning}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-center">
        <button
          onClick={onLaunch}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-10 py-4 rounded-full hover:from-violet-500 hover:to-indigo-500 transition-all text-lg disabled:opacity-60"
        >
          {saving ? <><Loader2 size={18} className="animate-spin" /> Launching…</> : <>This is the one — launch it ✨</>}
        </button>
        <p className="text-zinc-600 text-xs mt-3">You can refine everything later.</p>
      </motion.div>
    </motion.div>
  );
}

function InfoCard({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 ${wide ? "md:col-span-3" : ""}`}>
      <p className="font-mono text-[9px] tracking-widest text-zinc-500 mb-1.5">{label}</p>
      <div className="text-sm text-zinc-300 leading-relaxed">{children}</div>
    </div>
  );
}
function OppRow({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <p className="text-zinc-300"><span className="text-zinc-500">{label}:</span> {text}</p>
    </div>
  );
}

/* ── STEP 5: LAUNCH PLAN ───────────────────────────────────── */
function LaunchStage({ result, onProduct, onDashboard }: {
  result: OnboardResult; brandId: string | null; onProduct: () => void; onDashboard: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto px-6 pt-16 pb-24 text-center"
    >
      {/* Celebration */}
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
        className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
        <Trophy size={34} className="text-white" />
      </motion.div>
      <p className="font-mono text-[11px] tracking-widest text-green-400 mb-2">BRAND BUILDER · UNLOCKED</p>
      <h1 className="text-4xl font-black tracking-tight mb-2">{result.name} is live.</h1>
      <p className="text-zinc-400 mb-10">You just did in 2 minutes what most founders take weeks to do. Here&apos;s what&apos;s next.</p>

      {/* Launch checklist */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 mb-8 text-left">
        <p className="font-mono text-[10px] tracking-widest text-zinc-500 mb-4">LAUNCH PLAN</p>
        <Step done label="Brand created" sub="Name, story, identity, voice" />
        <Step done label="Brand Book generating" sub="Your full strategy — ready in the dashboard shortly" />
        <Step label="Add your first product" sub="Pick a product, AI designs it — recommended next" highlight />
        <Step label="Publish your storefront" sub="Your store goes live for customers" />
        <Step label="Make your first sale" sub="Real customers, real revenue" />
      </div>

      {/* Recommended first products */}
      {result.recommended_products && result.recommended_products.length > 0 && (
        <div className="mb-8 text-left">
          <p className="font-mono text-[10px] tracking-widest text-zinc-500 mb-3">RECOMMENDED FIRST PRODUCTS</p>
          <div className="space-y-2">
            {result.recommended_products.slice(0, 3).map((p, i) => (
              <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 flex items-center gap-3">
                <Package size={15} className="text-violet-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{p.name}</p>
                  <p className="text-[11px] text-zinc-500 truncate">{p.why}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Tag>{p.difficulty}</Tag>
                  <Tag>{p.margin} margin</Tag>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onProduct}
          className="inline-flex items-center justify-center gap-2 bg-violet-600 text-white font-bold px-7 py-3.5 rounded-full hover:bg-violet-500 transition-colors">
          <Package size={16} /> Create first product
        </button>
        <button onClick={onDashboard}
          className="inline-flex items-center justify-center gap-2 border border-zinc-700 text-zinc-300 font-bold px-7 py-3.5 rounded-full hover:bg-zinc-900 transition-colors">
          <Store size={16} /> Go to dashboard
        </button>
      </div>
    </motion.div>
  );
}

function Step({ done, label, sub, highlight }: { done?: boolean; label: string; sub: string; highlight?: boolean }) {
  return (
    <div className={`flex items-start gap-3 py-2.5 ${highlight ? "bg-violet-500/10 -mx-2 px-2 rounded-lg" : ""}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        done ? "bg-green-500" : highlight ? "border-2 border-violet-500" : "border-2 border-zinc-700"
      }`}>
        {done && <Check size={11} />}
      </div>
      <div>
        <p className={`text-sm font-bold ${done ? "text-zinc-400 line-through" : "text-white"}`}>{label}</p>
        <p className="text-[11px] text-zinc-500">{sub}</p>
      </div>
    </div>
  );
}
function Tag({ children }: { children: React.ReactNode }) {
  return <span className="text-[9px] font-mono tracking-wider bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{children}</span>;
}
