"use client";

/**
 * Store Settings — the merchant's storefront customizer.
 *
 * Edits the brand fields that drive the live store: name, tagline, hero copy
 * (story), palette colors, and fonts. Saves via PATCH /api/brands/[id]. Fonts
 * are stored on the top-level `typography` field so a later Brand Book regen
 * doesn't wipe them. A live preview mirrors the storefront hero.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BrandDNA, ColorPalette } from "@/lib/types";
import { STORE_FONTS, googleFontsHref, fontStack, knownFont } from "@/lib/store-fonts";
import { contrastRatio } from "@/lib/color";
import { ArrowLeft, Loader2, Save, ExternalLink, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

const PALETTE_FIELDS: { key: keyof ColorPalette; label: string }[] = [
  { key: "primary",    label: "Primary" },
  { key: "secondary",  label: "Secondary" },
  { key: "accent",     label: "Accent" },
  { key: "background", label: "Background" },
  { key: "text",       label: "Text" },
];

export default function StoreSettingsPage() {
  const { brandId } = useParams<{ brandId: string }>();
  const [brand, setBrand] = useState<BrandDNA | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable fields.
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [story, setStory] = useState("");
  const [palette, setPalette] = useState<ColorPalette>({} as ColorPalette);
  const [headlineFont, setHeadlineFont] = useState("Inter");
  const [bodyFont, setBodyFont] = useState("Inter");

  const load = useCallback(async () => {
    const b: BrandDNA = await fetch(`/api/brands/${brandId}`).then(r => r.json());
    setBrand(b);
    setName(b.name || "");
    setTagline(b.tagline || "");
    setStory(b.story || "");
    setPalette({ ...(b.palette || {}) } as ColorPalette);
    setHeadlineFont(knownFont(b.typography?.heading) || knownFont(b.brand_book?.typography_detail?.headline_font) || "Inter");
    setBodyFont(knownFont(b.typography?.body) || knownFont(b.brand_book?.typography_detail?.body_font) || "Inter");
  }, [brandId]);

  useEffect(() => { load(); }, [load]);

  // Load the selected fonts so the preview renders them for real.
  useEffect(() => {
    const href = googleFontsHref([headlineFont, bodyFont]);
    if (!href) return;
    const id = "store-settings-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id; link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [headlineFont, bodyFont]);

  function setColor(key: keyof ColorPalette, value: string) {
    setPalette(p => ({ ...p, [key]: value }));
  }

  async function save() {
    if (!brand) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/brands/${brandId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, tagline, story,
          palette,
          typography: { ...(brand.typography || {}), heading: headlineFont, body: bodyFont },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Storefront updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!brand) {
    return <div className="p-8 flex items-center justify-center min-h-screen"><Loader2 size={20} className="animate-spin text-zinc-300" /></div>;
  }

  const slug = (brand as { slug?: string }).slug;
  const bg = palette.background || "#ffffff";
  const text = palette.text || "#0a0a0a";
  const lowContrast = contrastRatio(text, bg) < 3;

  return (
    <div className="min-h-full bg-[#F5F5F0]">
      {/* Sticky header / save bar */}
      <div className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href={`/dashboard/${brandId}`} className="w-9 h-9 border border-zinc-200 rounded-xl flex items-center justify-center hover:bg-zinc-50 transition-colors">
          <ArrowLeft size={15} className="text-zinc-600" />
        </Link>
        <div>
          <h1 className="font-black text-zinc-900 text-lg tracking-tight">Store Settings</h1>
          <p className="font-mono text-[10px] tracking-widest text-zinc-400">CUSTOMIZE YOUR LIVE STOREFRONT</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {slug && (
            <a href={`/store/${slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold border border-zinc-200 text-zinc-700 px-3 py-2 rounded-xl hover:bg-zinc-50 transition-colors">
              View store <ExternalLink size={11} />
            </a>
          )}
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 bg-violet-600 text-white font-bold text-sm px-5 py-2 rounded-xl hover:bg-violet-500 transition-colors disabled:opacity-50">
            {saving ? <><Loader2 size={13} className="animate-spin" /> Saving</> : <><Save size={13} /> Save changes</>}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Form ── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Basics */}
          <Card label="BRAND BASICS">
            <Field label="Brand name">
              <input value={name} onChange={e => setName(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Tagline (your storefront headline)">
              <input value={tagline} onChange={e => setTagline(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Hero text (the line under your headline)">
              <textarea value={story} onChange={e => setStory(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
            </Field>
          </Card>

          {/* Colors */}
          <Card label="COLORS">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PALETTE_FIELDS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3 border border-zinc-200 rounded-xl p-2.5">
                  <input
                    type="color"
                    value={palette[key] || "#000000"}
                    onChange={e => setColor(key, e.target.value)}
                    className="w-9 h-9 rounded-lg border border-zinc-200 bg-transparent cursor-pointer p-0 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900">{label}</p>
                    <input
                      value={palette[key] || ""}
                      onChange={e => setColor(key, e.target.value)}
                      className="font-mono text-[11px] text-zinc-500 bg-transparent focus:outline-none w-24 uppercase"
                    />
                  </div>
                </div>
              ))}
            </div>
            {lowContrast && (
              <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <span>Your <b>Text</b> color may be hard to read on your <b>Background</b>. We auto-correct it on the live store, but a higher-contrast pair looks best.</span>
              </div>
            )}
          </Card>

          {/* Typography */}
          <Card label="TYPOGRAPHY">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Headline font">
                <FontSelect value={headlineFont} onChange={setHeadlineFont} />
                <p className="mt-2 text-2xl text-zinc-900" style={{ fontFamily: fontStack(headlineFont) }}>{name || "Your Brand"}</p>
              </Field>
              <Field label="Body font">
                <FontSelect value={bodyFont} onChange={setBodyFont} />
                <p className="mt-2 text-sm text-zinc-600" style={{ fontFamily: fontStack(bodyFont) }}>The quick brown fox jumps over the lazy dog.</p>
              </Field>
            </div>
          </Card>
        </div>

        {/* ── Live preview ── */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-3">LIVE PREVIEW</p>
            <div className="rounded-2xl overflow-hidden border border-zinc-200 shadow-sm" style={{ backgroundColor: bg, color: text }}>
              <div className="px-6 py-8">
                <p className="font-mono text-[10px] tracking-widest mb-3 opacity-60">{brand.niche?.toUpperCase()}</p>
                <h2 className="text-3xl font-black leading-tight mb-3" style={{ fontFamily: fontStack(headlineFont) }}>
                  {tagline || "Your tagline here"}
                </h2>
                <p className="text-sm opacity-75 mb-5 leading-relaxed" style={{ fontFamily: fontStack(bodyFont) }}>
                  {story || "The supporting line that tells your story."}
                </p>
                <span className="inline-flex px-5 py-2.5 rounded-full font-bold text-sm" style={{ backgroundColor: palette.primary || "#7c3aed", color: contrastRatio("#ffffff", palette.primary || "#7c3aed") >= 3 ? "#ffffff" : "#0a0a0a" }}>
                  Shop Collection
                </span>
              </div>
              <div className="h-2 flex">
                {PALETTE_FIELDS.map(({ key }) => <div key={key} className="flex-1" style={{ backgroundColor: palette[key] }} />)}
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-3">Changes apply to your live store as soon as you save.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all";

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6">
      <p className="font-mono text-[10px] tracking-widest text-violet-600 mb-4">{label}</p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] tracking-widest text-zinc-400 mb-1.5 uppercase">{label}</span>
      {children}
    </label>
  );
}

function FontSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
      {STORE_FONTS.map(f => <option key={f.name} value={f.name}>{f.name} · {f.category}</option>)}
    </select>
  );
}
