import Link from "next/link";
import { notFound } from "next/navigation";
import PublicGuidesShell from "@/components/guides/PublicGuidesShell";
import { getGuide, GUIDES, GuideSection } from "@/lib/guides";
import { ArrowLeft, ArrowRight, Clock, Lightbulb, Check } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide — Frito AI" };
  return { title: `${guide.title} — Frito AI`, description: guide.summary };
}

export default async function PublicGuideDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const idx = GUIDES.findIndex(g => g.slug === guide.slug);
  const next = GUIDES.find((g, i) => i > idx && g.category === guide.category) || GUIDES[(idx + 1) % GUIDES.length];

  return (
    <PublicGuidesShell>
      {/* Header */}
      <div className="bg-zinc-900 text-white px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <Link href="/guides" className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors mb-5">
            <ArrowLeft size={12} /> THE PLAYBOOK
          </Link>
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="font-mono text-[10px] tracking-widest text-violet-400">{guide.category.toUpperCase()}</span>
            <span className="font-mono text-[10px] tracking-widest text-zinc-600">·</span>
            <span className="font-mono text-[10px] tracking-widest text-zinc-500">{guide.level}</span>
            <span className="flex items-center gap-1 font-mono text-[10px] tracking-widest text-zinc-500"><Clock size={11} /> {guide.readMins} MIN</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">{guide.title}</h1>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-lg text-zinc-700 leading-relaxed mb-8">{guide.intro}</p>

        <div className="space-y-8">
          {guide.sections.map((s, i) => <Section key={i} section={s} />)}
        </div>

        {/* Signup CTA (public — visitor has no brand yet) */}
        <div className="mt-10 bg-zinc-900 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-violet-400 mb-1">READY TO START?</p>
            <p className="font-bold text-white">Build your brand and put this guide to work.</p>
          </div>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-violet-600 text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-violet-500 transition-colors">
            Start your brand free <ArrowRight size={15} />
          </Link>
        </div>

        {/* Next guide */}
        {next && next.slug !== guide.slug && (
          <Link href={`/guides/${next.slug}`} className="mt-4 flex items-center justify-between gap-4 bg-white border border-zinc-200 rounded-2xl p-5 hover:border-zinc-300 hover:shadow-sm transition-all group">
            <div>
              <p className="font-mono text-[9px] tracking-widest text-zinc-400 mb-0.5">UP NEXT</p>
              <p className="font-bold text-zinc-900">{next.title}</p>
            </div>
            <ArrowRight size={16} className="text-zinc-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </Link>
        )}
      </article>
    </PublicGuidesShell>
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
