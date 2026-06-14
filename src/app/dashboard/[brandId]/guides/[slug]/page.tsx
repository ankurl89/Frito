"use client";

/**
 * Guide detail — a clean, readable article rendered from structured content.
 */

import { useParams } from "next/navigation";
import Link from "next/link";
import { getGuide, GUIDES, GuideSection } from "@/lib/guides";
import { ArrowLeft, ArrowRight, Clock, Lightbulb, Check } from "lucide-react";

export default function GuideDetailPage() {
  const { brandId, slug } = useParams<{ brandId: string; slug: string }>();
  const guide = getGuide(slug);

  if (!guide) {
    return (
      <div className="min-h-full bg-[#F5F5F0] flex items-center justify-center p-8">
        <div className="text-center">
          <p className="font-bold text-zinc-900 mb-2">Guide not found</p>
          <Link href={`/dashboard/${brandId}/guides`} className="text-violet-600 font-semibold text-sm">← Back to the Playbook</Link>
        </div>
      </div>
    );
  }

  // Suggest the next guide in the same category, else the next overall.
  const idx = GUIDES.findIndex(g => g.slug === guide.slug);
  const next = GUIDES.find((g, i) => i > idx && g.category === guide.category) || GUIDES[(idx + 1) % GUIDES.length];
  const ctaHref = guide.cta?.href.replace("{brandId}", brandId);

  return (
    <div className="min-h-full bg-[#F5F5F0]">
      {/* Header */}
      <div className="bg-zinc-900 text-white px-8 py-10">
        <div className="max-w-3xl mx-auto">
          <Link href={`/dashboard/${brandId}/guides`} className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors mb-5">
            <ArrowLeft size={12} /> THE PLAYBOOK
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-[10px] tracking-widest text-violet-400">{guide.category.toUpperCase()}</span>
            <span className="font-mono text-[10px] tracking-widest text-zinc-600">·</span>
            <span className="font-mono text-[10px] tracking-widest text-zinc-500">{guide.level}</span>
            <span className="flex items-center gap-1 font-mono text-[10px] tracking-widest text-zinc-500"><Clock size={11} /> {guide.readMins} MIN</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">{guide.title}</h1>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-8 py-10">
        <p className="text-lg text-zinc-700 leading-relaxed mb-8">{guide.intro}</p>

        <div className="space-y-8">
          {guide.sections.map((s, i) => <Section key={i} section={s} />)}
        </div>

        {/* CTA */}
        {guide.cta && ctaHref && (
          <div className="mt-10 bg-zinc-900 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-violet-400 mb-1">DO IT NOW</p>
              <p className="font-bold text-white">Put this guide into action.</p>
            </div>
            <Link href={ctaHref} className="inline-flex items-center gap-2 bg-violet-600 text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-violet-500 transition-colors">
              {guide.cta.label} <ArrowRight size={15} />
            </Link>
          </div>
        )}

        {/* Next guide */}
        {next && next.slug !== guide.slug && (
          <Link href={`/dashboard/${brandId}/guides/${next.slug}`} className="mt-4 flex items-center justify-between gap-4 bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-300 hover:shadow-sm transition-all group">
            <div>
              <p className="font-mono text-[9px] tracking-widest text-zinc-400 mb-0.5">UP NEXT</p>
              <p className="font-bold text-zinc-900">{next.title}</p>
            </div>
            <ArrowRight size={16} className="text-zinc-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </Link>
        )}
      </article>
    </div>
  );
}

function Section({ section }: { section: GuideSection }) {
  return (
    <section>
      <h2 className="text-xl font-black text-zinc-900 mb-3">{section.heading}</h2>

      {section.body?.map((p, i) => (
        <p key={i} className="text-zinc-700 leading-relaxed mb-3">{p}</p>
      ))}

      {section.steps && (
        <ol className="space-y-3 my-4">
          {section.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-violet-600 text-white font-mono text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <div>
                <p className="font-bold text-zinc-900 text-sm">{step.title}</p>
                <p className="text-zinc-600 text-sm leading-relaxed">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {section.bullets && (
        <ul className="space-y-2 my-4">
          {section.bullets.map((b, i) => (
            <li key={i} className="flex gap-2.5 text-zinc-700 text-sm leading-relaxed">
              <Check size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {section.tip && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <Lightbulb size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 leading-relaxed">{section.tip}</p>
        </div>
      )}
    </section>
  );
}
