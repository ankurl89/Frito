/**
 * Storefront Homepage — AI-themed brand experience.
 *
 * Auto-composed from the Brand Book. No theme picker, no template chooser —
 * the entire experience derives from the brand's documented identity.
 *
 * Sections:
 *  - Hero (headline from tagline, copy from Brand Book story)
 *  - Featured products (Best Sellers — currently random; pluggable later)
 *  - Brand story (from Brand Book)
 *  - Collection grid (categories)
 *  - Social proof callout
 */

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BrandDNA, Product } from "@/lib/types";
import { ArrowRight } from "lucide-react";
import StorefrontProductCard from "@/components/storefront/StorefrontProductCard";

export default async function StorefrontHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const [{ data: brand }, { data: products }] = await Promise.all([
    supabase.from("brands").select("*").eq("slug", slug).single(),
    supabase.from("products").select("*").eq("status", "published"),
  ]);

  if (!brand) notFound();

  // Also include legacy "active" status for backward compat.
  const { data: legacyProducts } = await supabase
    .from("products")
    .select("*")
    .eq("brand_id", brand.id)
    .eq("status", "active");

  const allProducts = ([...(products || []), ...(legacyProducts || [])].filter(
    (p, i, arr) => arr.findIndex(q => q.id === p.id) === i && p.brand_id === brand.id
  ) as Product[]).slice(0, 12);

  const b = brand as BrandDNA;
  const featured = allProducts.slice(0, 4);
  const categories = [...new Set(allProducts.map(p => p.category))].slice(0, 6);

  return (
    <div style={{ backgroundColor: "var(--brand-bg)", color: "var(--brand-text)" }}>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 md:pt-32 md:pb-36">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="font-mono text-[11px] tracking-widest mb-4 opacity-60">{b.niche?.toUpperCase()}</p>
              <h1
                className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight mb-6"
                style={{ fontFamily: "var(--brand-headline-font)" }}
              >
                {b.tagline}
              </h1>
              <p className="text-lg opacity-75 mb-8 max-w-lg leading-relaxed">{b.story}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/store/${slug}/collection/all`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-fg)" }}
                >
                  Shop Collection <ArrowRight size={16} />
                </Link>
                <Link href="#story" className="inline-flex items-center justify-center px-8 py-4 rounded-full font-bold border-2 transition-colors" style={{ borderColor: "var(--brand-text)", color: "var(--brand-text)" }}>
                  Our Story
                </Link>
              </div>
            </div>

            {/* Hero visual — use the featured product mockup or a colour wash */}
            <div className="relative aspect-square rounded-3xl overflow-hidden" style={{ backgroundColor: "color-mix(in srgb, var(--brand-primary) 10%, transparent)" }}>
              {featured[0]?.mockup_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featured[0].mockup_url} alt={featured[0].name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-9xl font-black opacity-10" style={{ color: "var(--brand-primary)" }}>{b.name?.[0]}</div>
                </div>
              )}
              {/* Floating "live" pill */}
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur text-xs font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Store live
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED COLLECTION ── */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="font-mono text-[11px] tracking-widest opacity-60 mb-2">FEATURED</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ fontFamily: "var(--brand-headline-font)" }}>
                Best Sellers
              </h2>
            </div>
            <Link href={`/store/${slug}/collection/all`} className="text-sm font-bold flex items-center gap-1.5 hover:gap-2 transition-all">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map(p => <StorefrontProductCard key={p.id} product={p} slug={slug} />)}
          </div>
        </section>
      )}

      {/* ── BRAND STORY ── */}
      <section id="story" className="py-24" style={{ backgroundColor: "color-mix(in srgb, var(--brand-text) 4%, var(--brand-bg))" }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="font-mono text-[11px] tracking-widest opacity-60 mb-4">OUR STORY</p>
          <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight mb-6" style={{ fontFamily: "var(--brand-headline-font)" }}>
            {b.brand_book?.mission || b.story}
          </h2>
          <p className="text-lg opacity-75 leading-relaxed">{b.brand_book?.brand_meaning || b.story}</p>
          {b.brand_values?.length ? (
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {b.brand_values.map((v: string, i: number) => (
                <span key={i} className="px-4 py-1.5 rounded-full text-sm font-semibold" style={{ backgroundColor: "var(--brand-bg)", border: "1px solid color-mix(in srgb, var(--brand-text) 15%, transparent)" }}>
                  {v}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ── COLLECTIONS ── */}
      {categories.length > 1 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <p className="font-mono text-[11px] tracking-widest opacity-60 mb-2">SHOP BY CATEGORY</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-8" style={{ fontFamily: "var(--brand-headline-font)" }}>Collections</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map(cat => {
              const first = allProducts.find(p => p.category === cat);
              return (
                <Link key={cat} href={`/store/${slug}/collection/${cat.toLowerCase().replace(/\s+/g, "-")}`}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden"
                  style={{ backgroundColor: "color-mix(in srgb, var(--brand-primary) 8%, transparent)" }}
                >
                  {first?.mockup_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={first.mockup_url} alt={cat} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="font-mono text-[10px] tracking-widest opacity-80">SHOP</p>
                    <p className="font-black text-2xl tracking-tight" style={{ fontFamily: "var(--brand-headline-font)" }}>{cat}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── SOCIAL PROOF / CTA ──
          Always uses brand-text as background + brand-bg as text so the
          contrast is guaranteed regardless of how light the brand primary is. */}
      <section className="relative py-24 overflow-hidden" style={{ backgroundColor: "var(--brand-text)", color: "var(--brand-bg)" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="font-mono text-[11px] tracking-widest opacity-70 mb-4">JOIN THE MOVEMENT</p>
          <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight mb-4" style={{ fontFamily: "var(--brand-headline-font)" }}>
            {b.brand_book?.positioning_statement || `Welcome to ${b.name}`}
          </h2>
          <p className="opacity-80 mb-8 max-w-xl mx-auto">{b.brand_book?.why_choose_us || b.story}</p>
          <Link
            href={`/store/${slug}/collection/all`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-fg)" }}
          >
            Shop the Collection <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
