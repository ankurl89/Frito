/**
 * Storefront layout.
 *
 * Loads the brand by slug, applies its visual identity as CSS custom properties,
 * and renders a brand-themed shell (header + footer + main).
 *
 * This is a public, unauthenticated layout — customers don't sign in to shop.
 *
 * In production with wildcard DNS:
 *   otakudistrict.tryfrito.com → resolves brand by subdomain in proxy.ts
 * For now (local + path-based):
 *   /store/otakudistrict
 */

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BrandDNA, ColorPalette } from "@/lib/types";
import { readableForeground, ensureReadable } from "@/lib/color";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!brand) notFound();

  const b = brand as BrandDNA;
  const palette = (b.palette || {}) as ColorPalette;

  const primary = palette.primary || "#7c3aed";
  const secondary = palette.secondary || "#4f46e5";
  const accent = palette.accent || "#f59e0b";
  const bg = palette.background || "#ffffff";
  // Guarantee the body text actually reads on the background. A bad palette
  // (e.g. light-on-light or white-on-white) would otherwise be invisible.
  const text = ensureReadable(palette.text || "#0a0a0a", bg);
  // Card surface: a subtle elevation off the background. Text inherits
  // --brand-text, which is now contrast-safe against bg (and thus the surface).
  const surface = `color-mix(in srgb, ${text} 4%, ${bg})`;

  // Compute readable foreground colors for each surface — so light brand
  // colors (e.g. cream/pastel) get dark text instead of invisible white.
  const themeStyle = {
    "--brand-primary": primary,
    "--brand-primary-fg": readableForeground(primary),
    "--brand-secondary": secondary,
    "--brand-secondary-fg": readableForeground(secondary),
    "--brand-accent": accent,
    "--brand-accent-fg": readableForeground(accent),
    "--brand-bg": bg,
    "--brand-text": text,
    "--brand-surface": surface,
    "--brand-headline-font": b.brand_book?.typography_detail?.headline_font || "Inter, system-ui, sans-serif",
    "--brand-body-font": b.brand_book?.typography_detail?.body_font || "Inter, system-ui, sans-serif",
  } as React.CSSProperties;

  return (
    <div style={themeStyle} className="storefront-root min-h-screen flex flex-col" data-brand={b.slug}>
      <StorefrontHeader brand={b} />
      <main className="flex-1">{children}</main>
      <StorefrontFooter brand={b} />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: brand } = await supabase.from("brands").select("name, tagline").eq("slug", slug).single();
  if (!brand) return { title: "Store" };
  return {
    title: `${brand.name} — ${brand.tagline || ""}`,
    description: brand.tagline,
  };
}
