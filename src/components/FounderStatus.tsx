"use client";

/**
 * Founder status — sits at the top of the dashboard overview.
 * Renders the level bar, current streak, launch checklist, and recent achievements.
 *
 * Polls /api/founder/me every 8s to pick up XP awards that came in via webhooks
 * (e.g. first sale) without requiring a page refresh.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { ACHIEVEMENTS, Achievement, Level } from "@/lib/founder-constants";
import {
  Flame, Trophy, ChevronRight, Check, Lock,
  Sparkles, Palette, Package, Rocket, Layers, Crown,
  PartyPopper, IndianRupee, Gem, Zap, Moon, Award, type LucideIcon,
} from "lucide-react";
import toast from "react-hot-toast";

/** Premium line-icon + accent gradient per achievement (replaces flat emoji). */
const ACHIEVEMENT_ICON: Record<string, LucideIcon> = {
  signed_up: Sparkles,
  first_brand: Palette,
  first_product: Package,
  first_publish: Rocket,
  catalog_5: Layers,
  catalog_25: Crown,
  first_sale: PartyPopper,
  revenue_1k: IndianRupee,
  revenue_10k: Gem,
  revenue_1l: Trophy,
  streak_7: Flame,
  streak_30: Zap,
  night_owl: Moon,
};

const CATEGORY_ACCENT: Record<Achievement["category"], string> = {
  founder: "from-violet-500 to-indigo-600",
  product: "from-sky-500 to-blue-600",
  sales:   "from-amber-400 to-yellow-600",
  habit:   "from-orange-500 to-rose-600",
};

/** A premium achievement medallion: gradient disc + line icon + subtle ring. */
function Medallion({ achievement, size = 36 }: { achievement: Achievement; size?: number }) {
  const Icon = ACHIEVEMENT_ICON[achievement.key] || Award;
  const accent = CATEGORY_ACCENT[achievement.category] || "from-zinc-400 to-zinc-600";
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${accent} flex items-center justify-center ring-1 ring-white/30 shadow-sm`}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.46)} className="text-white" strokeWidth={2.2} />
    </div>
  );
}

interface FounderSnapshot {
  profile: { xp: number; level: number; current_streak: number; longest_streak: number };
  level: { current: Level; next: Level | null; progress_pct: number; xp_to_next: number };
  achievements: { achievement_key: string; unlocked_at: string }[];
  launch: {
    steps: { key: string; label: string; description: string; done: boolean }[];
    progress_pct: number;
    completed: number;
    total: number;
  };
}

export default function FounderStatus() {
  const [data, setData] = useState<FounderSnapshot | null>(null);
  const seenAchievements = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/founder/me");
    if (!res.ok) return;
    const snapshot: FounderSnapshot = await res.json();

    // Detect newly-unlocked achievements between polls and toast them.
    if (seenAchievements.current) {
      const newOnes = snapshot.achievements.filter(a => !seenAchievements.current!.has(a.achievement_key));
      for (const a of newOnes) {
        const meta = ACHIEVEMENTS[a.achievement_key];
        if (meta) {
          toast.custom(t => <AchievementToast achievement={meta} visible={t.visible} />, { duration: 6000 });
        }
      }
    }
    seenAchievements.current = new Set(snapshot.achievements.map(a => a.achievement_key));

    setData(snapshot);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  if (!data) return <FounderStatusSkeleton />;

  const { profile, level, launch, achievements } = data;
  const unlocked = achievements.map(a => ACHIEVEMENTS[a.achievement_key]).filter(Boolean);

  return (
    <div className="space-y-4 mb-8">
      {/* Top strip: level + streak */}
      <div className="bg-zinc-900 text-white rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Level */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3 mb-3">
              <span className="font-mono text-[10px] tracking-widest text-zinc-500">LEVEL {level.current.level}</span>
              <h2 className="text-3xl font-black tracking-tight">{level.current.name}</h2>
              {level.next && (
                <span className="font-mono text-[10px] text-zinc-500 ml-auto">
                  {level.xp_to_next} XP to {level.next.name}
                </span>
              )}
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-2 bg-gradient-to-r from-violet-500 to-yellow-300 rounded-full transition-all duration-700"
                style={{ width: `${level.progress_pct}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-mono text-[10px] text-zinc-500">{profile.xp.toLocaleString("en-IN")} XP TOTAL</span>
              {level.next && <span className="font-mono text-[10px] text-zinc-500">{level.next.min_xp.toLocaleString("en-IN")}</span>}
            </div>
          </div>

          {/* Streak */}
          <div className="bg-zinc-800 rounded-xl px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
              <Flame size={18} className="text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-black">{profile.current_streak}</p>
              <p className="font-mono text-[10px] tracking-widest text-zinc-500">DAY STREAK</p>
            </div>
          </div>
        </div>
      </div>

      {/* Launch checklist + achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Launch progress */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-violet-600 mb-1">LAUNCH PROGRESS</p>
              <p className="font-black text-zinc-900 text-lg">{launch.completed}/{launch.total} milestones</p>
            </div>
            <div className="text-right">
              <p className="font-black text-3xl text-zinc-900">{launch.progress_pct}%</p>
              <p className="font-mono text-[10px] tracking-widest text-zinc-400">COMPLETE</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden mb-5">
            <div className="h-2 bg-violet-600 rounded-full transition-all duration-700" style={{ width: `${launch.progress_pct}%` }} />
          </div>
          {/* Steps */}
          <div className="space-y-2">
            {launch.steps.map(step => (
              <div
                key={step.key}
                className={`flex items-center gap-3 p-2.5 rounded-xl ${step.done ? "bg-green-50" : "bg-zinc-50"}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.done ? "bg-green-500" : "border-2 border-zinc-300 bg-white"
                }`}>
                  {step.done && <Check size={13} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${step.done ? "text-green-900 line-through opacity-60" : "text-zinc-900"}`}>{step.label}</p>
                  <p className="text-[11px] text-zinc-500 truncate">{step.description}</p>
                </div>
                {!step.done && <ChevronRight size={13} className="text-zinc-400 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={14} className="text-amber-500" />
            <p className="font-mono text-[10px] tracking-widest text-zinc-400">ACHIEVEMENTS</p>
            <span className="ml-auto font-mono text-[10px] text-zinc-400">{unlocked.length}/{Object.keys(ACHIEVEMENTS).length}</span>
          </div>
          {unlocked.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3">
                <Trophy size={20} className="text-zinc-300" />
              </div>
              <p className="font-mono text-[10px] tracking-widest text-zinc-400">NONE UNLOCKED YET</p>
              <p className="text-xs text-zinc-500 mt-2">Complete your first milestone to earn one</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {unlocked.slice(0, 9).map(a => (
                <div key={a.key} className="aspect-square bg-zinc-50 border border-zinc-100 rounded-xl flex flex-col items-center justify-center p-2 gap-1.5" title={a.description}>
                  <Medallion achievement={a} size={34} />
                  <span className="font-mono text-[8px] tracking-wider text-zinc-500 text-center leading-tight">{a.name}</span>
                </div>
              ))}
              {/* Locked slots to suggest collection completeness */}
              {Array.from({ length: Math.max(0, 9 - unlocked.length) }).slice(0, 3).map((_, i) => (
                <div key={`locked-${i}`} className="aspect-square bg-zinc-50/50 border border-dashed border-zinc-200 rounded-xl flex items-center justify-center">
                  <Lock size={15} className="text-zinc-300" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AchievementToast({ achievement, visible }: { achievement: Achievement; visible: boolean }) {
  return (
    <div className={`${visible ? "animate-in" : ""} bg-zinc-900 text-white rounded-2xl shadow-2xl border border-zinc-800 p-4 flex items-center gap-4 max-w-sm`}>
      <div className="flex-shrink-0">
        <Medallion achievement={achievement} size={56} />
      </div>
      <div>
        <p className="font-mono text-[10px] tracking-widest text-violet-400 mb-0.5">ACHIEVEMENT UNLOCKED</p>
        <p className="font-black text-base">{achievement.name}</p>
        <p className="text-xs text-zinc-400">{achievement.description}</p>
      </div>
    </div>
  );
}

function FounderStatusSkeleton() {
  return (
    <div className="space-y-4 mb-8">
      <div className="bg-zinc-100 h-32 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-zinc-100 h-72 rounded-2xl animate-pulse" />
        <div className="bg-zinc-100 h-72 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
