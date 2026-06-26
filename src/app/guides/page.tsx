import Link from "next/link";
import PublicGuidesShell from "@/components/guides/PublicGuidesShell";
import { GUIDE_CATEGORIES, guidesByCategory, Guide } from "@/lib/guides";
import {
  Rocket, IndianRupee, PenLine, Sparkles, Target, Users, Zap,
  RefreshCw, Handshake, Clock, ArrowRight, GraduationCap, type LucideIcon,
} from "lucide-react";

export const metadata = {
  title: "Founder Playbook — Free guides for apparel founders | Frito AI",
  description: "No-fluff guides for first-time founders: your first sale, pricing, social content, ads, drops, repeat customers, and creator collabs.",
};

const ICONS: Record<string, LucideIcon> = {
  rocket: Rocket, rupee: IndianRupee, pen: PenLine, sparkles: Sparkles,
  target: Target, users: Users, zap: Zap, refresh: RefreshCw, handshake: Handshake,
};

const CAT_ACCENT: Record<string, string> = {
  Start:  "from-violet-500 to-indigo-600",
  Sell:   "from-emerald-500 to-green-600",
  Market: "from-amber-400 to-orange-600",
  Grow:   "from-sky-500 to-blue-600",
};

export default function PublicGuidesPage() {
  return (
    <PublicGuidesShell>
      {/* Hero */}
      <div className="bg-zinc-900 text-white px-6 py-14">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap size={16} className="text-violet-400" />
            <p className="font-mono text-[10px] tracking-widest text-zinc-500">FOUNDER PLAYBOOK</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Learn to build a brand that sells.</h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Real, no-fluff playbooks for first-time founders — from your first sale to ads, content, and
            repeat customers. Free to read, built for apparel brands in India.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-violet-600 text-white font-bold px-6 py-3 rounded-full hover:bg-violet-500 transition-colors mt-7"
          >
            Start your brand free <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {GUIDE_CATEGORIES.map(cat => {
          const guides = guidesByCategory(cat.key);
          if (guides.length === 0) return null;
          return (
            <section key={cat.key}>
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="text-xl font-black text-zinc-900">{cat.label}</h2>
                <p className="text-sm text-zinc-400">{cat.blurb}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guides.map(g => <GuideCard key={g.slug} guide={g} />)}
              </div>
            </section>
          );
        })}
      </div>
    </PublicGuidesShell>
  );
}

function GuideCard({ guide }: { guide: Guide }) {
  const Icon = ICONS[guide.icon] || Sparkles;
  const accent = CAT_ACCENT[guide.category] || "from-zinc-400 to-zinc-600";
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="group bg-white border border-zinc-200 rounded-2xl p-5 flex gap-4 hover:shadow-md hover:border-zinc-300 transition-all"
    >
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center flex-shrink-0 ring-1 ring-white/30`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-black text-zinc-900 leading-snug">{guide.title}</p>
        <p className="text-sm text-zinc-500 mt-1 leading-snug">{guide.summary}</p>
        <div className="flex items-center gap-3 mt-3">
          <span className="font-mono text-[9px] tracking-wider border border-zinc-200 text-zinc-500 px-2 py-0.5 rounded uppercase">{guide.level}</span>
          <span className="flex items-center gap-1 font-mono text-[9px] tracking-wider text-zinc-400">
            <Clock size={10} /> {guide.readMins} MIN
          </span>
          <ArrowRight size={14} className="ml-auto text-zinc-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}
