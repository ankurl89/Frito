"use client";

/**
 * Brand Book — the full brand operating system, displayed as a long
 * scrollable document. This is what a founder gets instead of paying
 * an agency.
 *
 * Generation is kicked off in onboarding and runs in the background.
 * Page polls for status until brand_book_status is "ready".
 *
 * The Brand Book becomes the source of truth for all downstream
 * AI-generated content (products, listings, social, email).
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { BrandDNA } from "@/lib/types";
import { Sparkles, Loader2, RefreshCw, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function BrandBookPage() {
  const { brandId } = useParams<{ brandId: string }>();
  const [brand, setBrand] = useState<BrandDNA | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const kickedOff = useRef(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/brands/${brandId}`);
    const data = await res.json();
    setBrand(data);
  }, [brandId]);

  useEffect(() => { load(); }, [load]);

  // Auto-kickoff: if status is "pending" or null and there's no book yet,
  // start generation. Guarded by a ref so it only fires once per mount.
  useEffect(() => {
    if (!brand || kickedOff.current) return;
    const needsGeneration =
      (!brand.brand_book || Object.keys(brand.brand_book).length === 0) &&
      (brand.brand_book_status === "pending" || !brand.brand_book_status);
    if (needsGeneration) {
      kickedOff.current = true;
      fetch("/api/brands/" + brandId, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_book_status: "generating" }),
      }).then(() => {
        fetch("/api/ai/brand-book", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandId }),
        }).then(load);
      });
    }
  }, [brand, brandId, load]);

  // Poll while generating.
  useEffect(() => {
    if (brand?.brand_book_status === "generating" || brand?.brand_book_status === "pending") {
      const interval = setInterval(load, 3000);
      return () => clearInterval(interval);
    }
  }, [brand?.brand_book_status, load]);

  async function regenerate() {
    setRegenerating(true);
    await fetch(`/api/brands/${brandId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand_book_status: "generating" }),
    });
    await fetch("/api/ai/brand-book", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId }),
    });
    await load();
    setRegenerating(false);
    toast.success("Brand book regenerated");
  }

  if (!brand) {
    return <div className="p-8 flex items-center justify-center min-h-screen"><Loader2 size={20} className="animate-spin text-zinc-300" /></div>;
  }

  const book = brand.brand_book;
  const palette = brand.palette as Record<string, string>;
  const isGenerating = brand.brand_book_status === "generating" || brand.brand_book_status === "pending" || (!book && brand.brand_book_status !== "failed");

  return (
    <div className="min-h-full bg-[#F5F5F0]">
      {/* Hero */}
      <div className="bg-zinc-900 text-white px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-[10px] tracking-widest text-zinc-500 mb-3">/ BRAND BOOK /</p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-3">{brand.name}<span className="text-violet-500">.</span></h1>
          <p className="text-zinc-400 italic text-lg max-w-2xl mb-6">&ldquo;{brand.tagline}&rdquo;</p>

          <div className="flex items-center gap-3 flex-wrap">
            {palette && Object.values(palette).slice(0, 5).map((color, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-zinc-700" style={{ backgroundColor: color }} title={color} />
            ))}
            <span className="font-mono text-[10px] tracking-wider border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded uppercase">{brand.niche}</span>
            <span className="font-mono text-[10px] tracking-wider border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded uppercase">{brand.price_tier}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-10">

        {/* Generation state banner */}
        {isGenerating && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 mb-8 flex items-center gap-5">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="text-violet-600 animate-pulse" />
            </div>
            <div>
              <p className="font-black text-zinc-900 mb-1">Building your Brand Book…</p>
              <p className="text-sm text-zinc-500">Frito is writing your brand strategy, personality, voice, positioning, and more. This takes 30-60 seconds.</p>
            </div>
          </div>
        )}

        {brand.brand_book_status === "failed" && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
            <div className="flex-1">
              <p className="font-black text-red-900 mb-1">Brand Book generation failed</p>
              <p className="text-sm text-red-700 mb-4">Something went wrong while writing your brand book. Try again.</p>
              <button onClick={regenerate} disabled={regenerating} className="bg-zinc-900 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-violet-600 transition-colors disabled:opacity-50 flex items-center gap-2">
                {regenerating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Retry
              </button>
            </div>
          </div>
        )}

        {/* Skeleton sections while loading */}
        {isGenerating && !book && (
          <div className="space-y-6">
            {[1,2,3].map(i => <SkeletonSection key={i} />)}
          </div>
        )}

        {/* The book */}
        {book && (
          <div className="space-y-12">
            {/* Foundation */}
            <Chapter num="01" title="Foundation">
              <Section title="Brand Meaning">
                <Prose>{book.brand_meaning}</Prose>
              </Section>

              <Section title="Alternative Names">
                <ChipGrid items={book.alternative_names} />
              </Section>

              <Section title="Domain Suggestions">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(book.domain_suggestions || []).map((d, i) => (
                    <CopyableChip key={i} text={d} />
                  ))}
                </div>
              </Section>

              <Section title="Brand Story">
                <Prose>{brand.story}</Prose>
              </Section>
            </Chapter>

            {/* Strategy */}
            <Chapter num="02" title="Strategy">
              <Pillar label="MISSION" body={book.mission} />
              <Pillar label="VISION" body={book.vision} />
              <Pillar label="BRAND PROMISE" body={book.brand_promise} />
              <Section title="Brand Values">
                <ChipGrid items={brand.brand_values} />
              </Section>
            </Chapter>

            {/* Customer Persona */}
            <Chapter num="03" title="Customer Persona">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <Stat label="AGE" value={book.persona?.age_range} />
                <Stat label="GENDER" value={book.persona?.gender_mix} />
                <Stat label="LOCATION" value={book.persona?.location} />
                <Stat label="INCOME" value={book.persona?.income} />
              </div>
              <Section title="Interests"><ChipGrid items={book.persona?.interests || []} /></Section>
              <Pillar label="BUYING BEHAVIOR" body={book.persona?.buying_behavior} />
              <Pillar label="MOTIVATIONS" body={book.persona?.motivations} />
              <Pillar label="PAIN POINTS" body={book.persona?.pain_points} />
              <Pillar label="ASPIRATIONS" body={book.persona?.aspirations} />
            </Chapter>

            {/* Personality */}
            <Chapter num="04" title="Personality & Archetype">
              <Section title="Personality Traits">
                <div className="space-y-3">
                  {(book.personality_traits || []).map((t, i) => (
                    <div key={i} className="bg-white border border-zinc-200 rounded-xl p-4">
                      <p className="font-black text-zinc-900 mb-1">{t.trait}</p>
                      <p className="text-sm text-zinc-600">{t.how_it_shows}</p>
                    </div>
                  ))}
                </div>
              </Section>
              <div className="bg-zinc-900 rounded-2xl p-6 text-white">
                <p className="font-mono text-[10px] tracking-widest text-zinc-500 mb-2">ARCHETYPE</p>
                <p className="text-4xl font-black tracking-tight mb-3">{book.archetype}</p>
                <p className="text-zinc-300 leading-relaxed">{book.archetype_reasoning}</p>
              </div>
            </Chapter>

            {/* Tone of Voice */}
            <Chapter num="05" title="Tone of Voice">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                  <p className="font-mono text-[10px] tracking-widest text-green-700 mb-3">WE ARE</p>
                  <div className="flex flex-wrap gap-2">
                    {(book.we_are || []).map((w, i) => (
                      <span key={i} className="bg-white border border-green-200 text-green-800 font-bold text-sm px-3 py-1 rounded-full">{w}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <p className="font-mono text-[10px] tracking-widest text-red-700 mb-3">WE ARE NOT</p>
                  <div className="flex flex-wrap gap-2">
                    {(book.we_are_not || []).map((w, i) => (
                      <span key={i} className="bg-white border border-red-200 text-red-800 font-bold text-sm px-3 py-1 rounded-full line-through opacity-70">{w}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Chapter>

            {/* Messaging */}
            <Chapter num="06" title="Messaging">
              <Section title="Taglines">
                <div className="space-y-2">
                  {(book.taglines || []).map((t, i) => (
                    <div key={i} className="bg-white border border-zinc-200 rounded-xl px-4 py-3 italic text-zinc-700">&ldquo;{t}&rdquo;</div>
                  ))}
                </div>
              </Section>
              <Section title="Sample Headlines">
                <div className="space-y-2">
                  {(book.headlines || []).map((h, i) => (
                    <p key={i} className="font-black text-xl text-zinc-900">{h}</p>
                  ))}
                </div>
              </Section>
              <Section title="Copy Examples">
                <div className="space-y-3">
                  {(book.copy_examples || []).map((c, i) => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="font-mono text-[9px] tracking-wider text-red-600 mb-1">INSTEAD OF</p>
                        <p className="text-sm text-zinc-700 line-through opacity-70">{c.instead_of}</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <p className="font-mono text-[9px] tracking-wider text-green-600 mb-1">SAY</p>
                        <p className="text-sm font-bold text-zinc-900">{c.say}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </Chapter>

            {/* Visual Identity */}
            <Chapter num="07" title="Visual Identity">
              <Section title="Color Palette">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(book.palette_meanings || []).map((c, i) => (
                    <div key={i} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                      <div className="h-24" style={{ backgroundColor: c.hex }} />
                      <div className="p-4">
                        <p className="font-black text-zinc-900">{c.color}</p>
                        <p className="font-mono text-xs text-zinc-500 mb-2">{c.hex}</p>
                        <p className="text-xs text-zinc-600 leading-relaxed">{c.meaning}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Typography">
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
                  <div>
                    <p className="font-mono text-[9px] tracking-widest text-zinc-400 mb-1">HEADLINE FONT</p>
                    <p className="font-black text-3xl text-zinc-900">{book.typography_detail?.headline_font}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] tracking-widest text-zinc-400 mb-1">BODY FONT</p>
                    <p className="font-medium text-lg text-zinc-700">{book.typography_detail?.body_font}</p>
                  </div>
                  <div className="pt-2 border-t border-zinc-100">
                    <p className="font-mono text-[9px] tracking-widest text-zinc-400 mb-1">USAGE RULES</p>
                    <p className="text-sm text-zinc-600">{book.typography_detail?.usage_rules}</p>
                  </div>
                </div>
              </Section>

              <Section title="Visual Style">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    ["PHOTOGRAPHY", book.visual_style?.photography],
                    ["ILLUSTRATION", book.visual_style?.illustration],
                    ["DESIGN DIRECTION", book.visual_style?.design_direction],
                    ["MOOD", book.visual_style?.mood],
                  ].map(([label, body]) => (
                    <div key={label as string} className="bg-white border border-zinc-200 rounded-xl p-4">
                      <p className="font-mono text-[9px] tracking-widest text-zinc-400 mb-2">{label}</p>
                      <p className="text-sm text-zinc-700 leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              </Section>
            </Chapter>

            {/* Brand Guidelines */}
            <Chapter num="08" title="Brand Guidelines">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                  <p className="font-mono text-[10px] tracking-widest text-green-700 mb-3">LOGO — DO</p>
                  <ul className="space-y-2">
                    {(book.logo_usage_do || []).map((d, i) => (
                      <li key={i} className="text-sm text-zinc-700 flex items-start gap-2">
                        <span className="text-green-600 font-bold flex-shrink-0">✓</span> {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <p className="font-mono text-[10px] tracking-widest text-red-700 mb-3">LOGO — DON&apos;T</p>
                  <ul className="space-y-2">
                    {(book.logo_usage_dont || []).map((d, i) => (
                      <li key={i} className="text-sm text-zinc-700 flex items-start gap-2">
                        <span className="text-red-600 font-bold flex-shrink-0">✗</span> {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Section title="Typography Hierarchy">
                <Prose>{book.typography_hierarchy}</Prose>
              </Section>
              <Section title="Social Visual Direction">
                <Prose>{book.social_visual_direction}</Prose>
              </Section>
            </Chapter>

            {/* Product Positioning */}
            <Chapter num="09" title="Product Positioning">
              <Section title="Core Categories"><ChipGrid items={book.core_categories} /></Section>
              <Section title="Hero Products"><ChipGrid items={book.hero_products} accent /></Section>
              <Section title="Launch Collection">
                <ol className="space-y-1.5">
                  {(book.launch_collection || []).map((p, i) => (
                    <li key={i} className="bg-white border border-zinc-200 rounded-xl px-4 py-3 flex items-center gap-3">
                      <span className="font-mono text-[10px] text-zinc-400 w-6">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-bold text-zinc-900">{p}</span>
                    </li>
                  ))}
                </ol>
              </Section>
              <Section title="Future Expansion"><ChipGrid items={book.future_expansion} /></Section>
            </Chapter>

            {/* Pricing */}
            <Chapter num="10" title="Pricing Strategy">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <PriceTier label="ENTRY" value={book.pricing_strategy?.entry_range} />
                <PriceTier label="CORE" value={book.pricing_strategy?.core_range} dark />
                <PriceTier label="PREMIUM" value={book.pricing_strategy?.premium_range} />
              </div>
              <Prose>{book.pricing_strategy?.reasoning}</Prose>
            </Chapter>

            {/* Competitive Positioning */}
            <Chapter num="11" title="Competitive Positioning">
              <Section title="Key Competitors"><ChipGrid items={book.competitors} /></Section>
              <Pillar label="WHY CHOOSE US" body={book.why_choose_us} />
              <div className="bg-violet-600 text-white rounded-2xl p-6">
                <p className="font-mono text-[10px] tracking-widest text-violet-200 mb-3">POSITIONING STATEMENT</p>
                <p className="text-xl font-black leading-snug">{book.positioning_statement}</p>
              </div>
            </Chapter>

            {/* Packaging */}
            <Chapter num="12" title="Packaging">
              <Pillar label="STYLE" body={book.packaging?.style} />
              <Pillar label="UNBOXING EXPERIENCE" body={book.packaging?.unboxing_experience} />
              <Pillar label="BRAND INSERTS" body={book.packaging?.brand_inserts} />
              <Section title="Thank You Message">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 italic text-amber-900 text-center">
                  &ldquo;{book.packaging?.thank_you_message}&rdquo;
                </div>
              </Section>
              <Pillar label="STICKER CONCEPTS" body={book.packaging?.sticker_concepts} />
            </Chapter>

            {/* Social Playbook */}
            <Chapter num="13" title="Social Media Playbook">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <SocialBio platform="INSTAGRAM" bio={book.social?.instagram_bio} />
                <SocialBio platform="TIKTOK" bio={book.social?.tiktok_bio} />
              </div>
              <Section title="Content Pillars"><ChipGrid items={book.social?.content_pillars || []} accent /></Section>
              <Section title="Posting Themes">
                <ol className="space-y-1.5">
                  {(book.social?.posting_themes || []).map((t, i) => (
                    <li key={i} className="bg-white border border-zinc-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
                      <span className="font-mono text-[10px] text-zinc-400 w-6">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-sm text-zinc-700">{t}</span>
                    </li>
                  ))}
                </ol>
              </Section>
              <Section title="Hashtags">
                <div className="flex flex-wrap gap-1.5">
                  {(book.social?.hashtags || []).map((h, i) => (
                    <span key={i} className="font-mono text-xs border border-zinc-200 bg-white text-zinc-600 px-2.5 py-1 rounded-full">{h.startsWith("#") ? h : `#${h}`}</span>
                  ))}
                </div>
              </Section>
            </Chapter>

            {/* Email Marketing */}
            <Chapter num="14" title="Email Marketing">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ["WELCOME", book.email_tones?.welcome],
                  ["ABANDONED CART", book.email_tones?.abandoned_cart],
                  ["LAUNCH", book.email_tones?.launch],
                  ["SUPPORT", book.email_tones?.support],
                ].map(([label, body]) => (
                  <div key={label as string} className="bg-white border border-zinc-200 rounded-2xl p-5">
                    <p className="font-mono text-[10px] tracking-widest text-violet-600 mb-2">{label}</p>
                    <p className="text-sm text-zinc-700 leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </Chapter>

            {/* Footer */}
            <div className="text-center py-12 border-t border-zinc-200">
              <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-2">/ END OF BRAND BOOK /</p>
              <p className="text-sm text-zinc-500">Generated by Frito AI · Source of truth for all future brand decisions</p>
              <button
                onClick={regenerate}
                disabled={regenerating}
                className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                {regenerating ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                Regenerate book
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────── */

function Chapter({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-6">
        <p className="font-mono text-[10px] tracking-widest text-violet-600 mb-1">CHAPTER {num}</p>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900">{title}</h2>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-3">{title.toUpperCase()}</p>
      {children}
    </div>
  );
}

function Pillar({ label, body }: { label: string; body?: string }) {
  if (!body) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5">
      <p className="font-mono text-[10px] tracking-widest text-violet-600 mb-2">{label}</p>
      <p className="text-zinc-800 leading-relaxed">{body}</p>
    </div>
  );
}

function Prose({ children }: { children?: React.ReactNode }) {
  return <p className="text-zinc-700 leading-relaxed">{children}</p>;
}

function ChipGrid({ items, accent }: { items?: string[]; accent?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(items || []).map((i, idx) => (
        <span key={idx} className={`font-bold text-sm px-3 py-1.5 rounded-full ${accent ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-700"}`}>
          {i}
        </span>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-4">
      <p className="font-mono text-[9px] tracking-widest text-zinc-400 mb-1">{label}</p>
      <p className="font-black text-zinc-900 text-sm">{value || "—"}</p>
    </div>
  );
}

function PriceTier({ label, value, dark }: { label: string; value?: string; dark?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 text-center ${dark ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200"}`}>
      <p className={`font-mono text-[9px] tracking-widest mb-2 ${dark ? "text-zinc-400" : "text-zinc-400"}`}>{label}</p>
      <p className="font-black text-2xl">{value || "—"}</p>
    </div>
  );
}

function SocialBio({ platform, bio }: { platform: string; bio?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-[10px] tracking-widest text-violet-600">{platform}</p>
        <button
          onClick={() => {
            if (!bio) return;
            navigator.clipboard.writeText(bio);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
        </button>
      </div>
      <p className="text-sm text-zinc-700 leading-relaxed">{bio || "—"}</p>
    </div>
  );
}

function CopyableChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-left flex items-center justify-between hover:border-zinc-400 transition-colors group"
    >
      <span className="font-mono text-sm text-zinc-700 truncate">{text}</span>
      {copied
        ? <Check size={13} className="text-green-500 flex-shrink-0" />
        : <Copy size={13} className="text-zinc-300 group-hover:text-zinc-600 flex-shrink-0 transition-colors" />
      }
    </button>
  );
}

function SkeletonSection() {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-3">
      <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse" />
      <div className="h-6 w-3/4 bg-zinc-100 rounded animate-pulse" />
      <div className="space-y-2 pt-3">
        <div className="h-3 bg-zinc-100 rounded animate-pulse" />
        <div className="h-3 w-5/6 bg-zinc-100 rounded animate-pulse" />
        <div className="h-3 w-4/6 bg-zinc-100 rounded animate-pulse" />
      </div>
    </div>
  );
}
