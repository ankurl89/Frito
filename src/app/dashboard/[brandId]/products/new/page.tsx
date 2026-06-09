"use client";

/**
 * Add Product — follows the PRD's 5-step workflow:
 *   1. Select supplier template (real product photo)
 *   2. Upload OR generate artwork (just the graphic)
 *   3. Preview placement on the actual template (Mockup Engine)
 *   4. Approve production view
 *   5. System auto-generates storefront mockup + production file
 *
 * The product itself (template) is NEVER altered by AI. Only the artwork
 * inside the print area is the AI-generated/uploaded element.
 */

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  QIKINK_CATALOG,
  CATEGORIES,
  suggestSellPrice,
  ProductTemplate,
} from "@/lib/qikink-catalog";
import { BrandDNA } from "@/lib/types";
import { ArrowLeft, Check, Loader2, Sparkles, Upload, Pencil, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import MockupCanvas, { MockupCanvasHandle } from "@/components/MockupCanvas";

type Step = "select" | "artwork" | "preview" | "pricing";

const STEPS: { key: Step; label: string }[] = [
  { key: "select", label: "TEMPLATE" },
  { key: "artwork", label: "ARTWORK" },
  { key: "preview", label: "PREVIEW" },
  { key: "pricing", label: "PRICING" },
];

export default function NewProductPage() {
  const { brandId } = useParams<{ brandId: string }>();
  const router = useRouter();
  const [step, setStep] = useState<Step>("select");
  const [brand, setBrand] = useState<BrandDNA | null>(null);

  // Selection
  const [template, setTemplate] = useState<ProductTemplate | null>(null);
  const [category, setCategory] = useState("All");

  // Artwork
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [artworkConcept, setArtworkConcept] = useState("");
  const [artworkPrompt, setArtworkPrompt] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Placement
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  // Pricing + listing
  const [sellPrice, setSellPrice] = useState(0);
  const [listing, setListing] = useState<{ listing_title: string; listing_description: string; seo_tags: string[] } | null>(null);
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<MockupCanvasHandle>(null);

  useEffect(() => {
    fetch(`/api/brands/${brandId}`).then(r => r.json()).then(setBrand);
  }, [brandId]);

  const stepIdx = STEPS.findIndex(s => s.key === step);
  const filtered = category === "All" ? QIKINK_CATALOG : QIKINK_CATALOG.filter(p => p.category === category);

  /** STEP 2: Generate artwork via AI (just the graphic, no product). */
  async function generateArtwork() {
    if (!brand || !template) return;
    setGenerating(true);
    setArtworkUrl(null);
    setValidationError(null);
    try {
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandDNA: brand,
          productName: template.name,
          productCategory: template.category,
          userDescription: aiDescription,
        }),
      });
      const data = await res.json();
      if (!data.url) {
        setValidationError(data.error || "AI didn't return valid artwork. Try again with a more specific description.");
        return;
      }

      // Artwork validation (Layer 2 of PRD)
      const validation = await validateArtwork(data.url);
      if (!validation.ok) {
        setValidationError(validation.reason);
        return;
      }

      setArtworkUrl(data.url);
      setArtworkConcept(data.concept || "");
      setArtworkPrompt(data.prompt || "");
      setStep("preview");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  /** STEP 2 (alt): Upload artwork PNG/SVG. */
  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/svg+xml", "image/jpeg"].includes(file.type)) {
      toast.error("Upload a PNG, SVG, or JPEG file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File too large (max 8MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = async ev => {
      const url = ev.target?.result as string;
      const validation = await validateArtwork(url);
      if (!validation.ok) {
        setValidationError(validation.reason);
        return;
      }
      setArtworkUrl(url);
      setArtworkConcept("Uploaded artwork");
      setStep("preview");
    };
    reader.readAsDataURL(file);
  }

  /** STEP 4 → 5: Approve preview, generate listing, advance to pricing. */
  async function approvePreview() {
    if (!brand || !template) return;
    setGenerating(true);
    try {
      const listingRes = await fetch("/api/ai/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandDNA: brand,
          productName: template.name,
          productCategory: template.category,
          designDescription: artworkConcept || artworkPrompt,
        }),
      });
      const listingData = await listingRes.json();
      setListing(listingData);
      setSellPrice(suggestSellPrice(template.base_price, brand.price_tier));
      setStep("pricing");
    } catch {
      toast.error("Listing generation failed");
    } finally {
      setGenerating(false);
    }
  }

  /**
   * STEP 5: Save Product via the PVE.
   *   1. create the product (draft) — gives us a productId
   *   2. run the server-side rendering pipeline (Sharp) → high-res assets + score
   *   3. publish if the visualization score clears the threshold, else keep draft
   */
  async function saveProduct() {
    if (!brand || !template || !listing) return;
    setSaving(true);
    try {
      // 1) Create the product as a draft.
      const createRes = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: brandId,
          name: template.name,
          description: listing.listing_description,
          category: template.category,
          qikink_product_id: template.id,
          qikink_product_name: template.name,
          template_view: "front",
          base_cost: template.base_price,
          sell_price: sellPrice,
          design_prompt: artworkPrompt,
          artwork_url: artworkUrl,
          design_url: artworkUrl,
          placement: { scale, offset_x: offsetX, offset_y: offsetY },
          variants: template.available_sizes.map(s => ({ size: s, price: sellPrice })),
          listing_title: listing.listing_title,
          listing_description: listing.listing_description,
          seo_tags: listing.seo_tags,
          status: "draft",
        }),
      });
      const product = await createRes.json();
      if (product.error) throw new Error(product.error);

      // 2) Run the PVE rendering pipeline (server-side Sharp).
      const renderRes = await fetch("/api/pve/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productTemplateId: template.id,
          artwork: artworkUrl,
          placement: { scale, offset_x: offsetX, offset_y: offsetY },
          brandPalette: brand.palette,
        }),
      });
      const renderData = await renderRes.json();
      if (!renderRes.ok) throw new Error(renderData.error || "Asset generation failed");

      const score = renderData.score?.total ?? 0;
      const publishable = renderData.score?.publishable ?? false;

      // 3) Publish if it clears the bar; otherwise leave as draft.
      if (publishable) {
        await fetch(`/api/products/${product.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "published" }),
        });
        toast.success(`Published! Visualization score ${score}/100`);
      } else {
        toast(`Saved as draft · score ${score}/100. Improve the artwork to publish.`, { icon: "📝" });
      }

      router.push(`/dashboard/${brandId}/products/${product.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-full bg-[#F5F5F0]">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-8 py-5 flex items-center gap-5 sticky top-0 z-10">
        <Link href={`/dashboard/${brandId}/products`} className="w-9 h-9 border border-zinc-200 rounded-xl flex items-center justify-center hover:bg-zinc-50 transition-colors">
          <ArrowLeft size={15} className="text-zinc-600" />
        </Link>
        <div>
          <h1 className="font-black text-zinc-900 text-lg tracking-tight">Add Product</h1>
          <p className="font-mono text-[10px] tracking-widest text-zinc-400">REAL TEMPLATE · MANUFACTURING ACCURATE</p>
        </div>

        {/* Step tracker */}
        <div className="ml-auto flex items-center gap-3">
          {STEPS.map((s, i) => {
            const done = stepIdx > i;
            const active = stepIdx === i;
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${done ? "bg-green-500" : active ? "bg-zinc-900" : "bg-zinc-100"}`}>
                  {done ? <Check size={11} className="text-white" /> : <span className={`font-mono text-[10px] font-bold ${active ? "text-white" : "text-zinc-400"}`}>{i + 1}</span>}
                </div>
                <span className={`font-mono text-[10px] tracking-widest hidden md:block ${active ? "text-zinc-900 font-bold" : "text-zinc-400"}`}>{s.label}</span>
                {i < STEPS.length - 1 && <div className="w-6 h-px bg-zinc-200 ml-1" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto">

        {/* ── STEP 1: Select template ── */}
        {step === "select" && (
          <div>
            <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-3">/ SUPPLIER CATALOG /</p>
            <div className="flex gap-2 mb-6 flex-wrap">
              {["All", ...CATEGORIES].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${category === cat ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(t => (
                <div
                  key={t.id}
                  onClick={() => setTemplate(t)}
                  className={`bg-white border rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                    template?.id === t.id ? "border-zinc-900 ring-2 ring-zinc-900 shadow-md" : "border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  <div className="aspect-square bg-zinc-50 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.views.front.url} alt={t.name} className="w-full h-full object-cover" />
                    {template?.id === t.id && (
                      <div className="absolute inset-0 bg-zinc-900/15 flex items-center justify-center">
                        <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-xs text-zinc-900 truncate">{t.name}</p>
                    <p className="font-mono text-[10px] text-zinc-400 mt-0.5">from ₹{t.base_price} · {t.material.split(",")[0]}</p>
                  </div>
                </div>
              ))}
            </div>

            {template && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-zinc-900 text-white rounded-2xl px-6 py-4 flex items-center gap-5 shadow-2xl">
                  <div>
                    <p className="font-bold text-sm">{template.name}</p>
                    <p className="font-mono text-[10px] text-zinc-400">base cost ₹{template.base_price}</p>
                  </div>
                  <button onClick={() => setStep("artwork")} className="bg-violet-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-violet-500 transition-colors flex items-center gap-2">
                    Next: Artwork →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Artwork ── */}
        {step === "artwork" && template && (
          <div className="max-w-lg mx-auto">
            <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-3">/ STEP 2 — ARTWORK /</p>
            <h2 className="text-2xl font-black text-zinc-900 mb-1 tracking-tight">Add your design</h2>
            <p className="text-zinc-500 text-sm mb-6">Upload your own artwork, or let AI generate it from your brand.</p>

            {/* Upload */}
            <label className="block bg-white border-2 border-dashed border-zinc-300 rounded-2xl p-6 text-center hover:border-violet-400 transition-colors cursor-pointer mb-3">
              <input type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden" onChange={handleUpload} />
              <Upload size={20} className="mx-auto text-zinc-400 mb-2" />
              <p className="font-bold text-sm text-zinc-900">Upload artwork</p>
              <p className="font-mono text-[10px] text-zinc-400 mt-1">PNG · SVG · JPEG · MAX 8MB</p>
            </label>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-zinc-200" />
              <span className="font-mono text-[10px] text-zinc-400 tracking-widest">OR</span>
              <div className="flex-1 h-px bg-zinc-200" />
            </div>

            {/* AI generation */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6">
              <label className="block font-mono text-[10px] tracking-widest text-zinc-400 mb-2">
                DESCRIBE THE ARTWORK <span className="text-zinc-300">(OPTIONAL)</span>
              </label>
              <textarea
                value={aiDescription}
                onChange={e => setAiDescription(e.target.value)}
                placeholder={`E.g. "A geometric tiger illustration in our brand colors"`}
                rows={3}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
              <button
                onClick={generateArtwork}
                disabled={generating}
                className="w-full mt-4 bg-zinc-900 text-white font-bold py-3.5 rounded-xl hover:bg-violet-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating
                  ? <><Loader2 size={14} className="animate-spin" /> Generating artwork…</>
                  : <><Sparkles size={14} /> Generate with AI</>
                }
              </button>
            </div>

            {validationError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
                <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm text-red-900">Artwork rejected</p>
                  <p className="text-xs text-red-700 mt-1">{validationError}</p>
                </div>
              </div>
            )}

            <button onClick={() => setStep("select")} className="mt-6 font-mono text-xs text-zinc-500 hover:text-zinc-900 transition-colors">← Change template</button>
          </div>
        )}

        {/* ── STEP 3: Preview placement ── */}
        {step === "preview" && template && artworkUrl && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Mockup canvas */}
            <div className="md:col-span-3">
              <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-3">/ STEP 3 — PLACEMENT PREVIEW /</p>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex justify-center">
                <MockupCanvas
                  ref={canvasRef}
                  templateUrl={template.views.front.url}
                  artworkUrl={artworkUrl}
                  printArea={template.views.front.print_area}
                  scale={scale}
                  offsetX={offsetX}
                  offsetY={offsetY}
                  displaySize={500}
                />
              </div>
              <p className="font-mono text-[9px] text-zinc-400 mt-3 text-center tracking-wider">
                ↑ THIS IS EXACTLY HOW THE PRODUCT WILL LOOK · SUPPLIER TEMPLATE NEVER MODIFIED
              </p>
            </div>

            {/* Controls */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-4">PLACEMENT</p>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-mono text-zinc-500 tracking-wider">SCALE</span>
                      <span className="font-black text-zinc-900">{Math.round(scale * 100)}%</span>
                    </div>
                    <input type="range" min={0.3} max={1} step={0.05} value={scale}
                      onChange={e => setScale(Number(e.target.value))}
                      className="w-full accent-violet-600" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-mono text-zinc-500 tracking-wider">HORIZONTAL</span>
                      <span className="font-black text-zinc-900">{offsetX}px</span>
                    </div>
                    <input type="range" min={-50} max={50} value={offsetX}
                      onChange={e => setOffsetX(Number(e.target.value))}
                      className="w-full accent-violet-600" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-mono text-zinc-500 tracking-wider">VERTICAL</span>
                      <span className="font-black text-zinc-900">{offsetY}px</span>
                    </div>
                    <input type="range" min={-50} max={50} value={offsetY}
                      onChange={e => setOffsetY(Number(e.target.value))}
                      className="w-full accent-violet-600" />
                  </div>
                </div>
              </div>

              {/* Template specs */}
              <div className="bg-zinc-900 rounded-2xl p-5 text-white">
                <p className="font-mono text-[10px] tracking-widest text-zinc-500 mb-3">PRODUCTION SPEC</p>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">Product</span><span className="font-bold">{template.name}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Material</span><span className="font-bold text-xs">{template.material}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">View</span><span className="font-bold">Front</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Print size</span><span className="font-bold">{template.views.front.print_area.print_px_width}×{template.views.front.print_area.print_px_height}</span></div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep("artwork")} className="flex-1 border-2 border-zinc-200 text-zinc-600 font-bold text-sm py-3 rounded-xl hover:border-zinc-400 transition-colors flex items-center justify-center gap-2">
                  <Pencil size={13} /> Change artwork
                </button>
                <button onClick={approvePreview} disabled={generating} className="flex-1 bg-violet-600 text-white font-bold text-sm py-3 rounded-xl hover:bg-violet-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {generating ? <><Loader2 size={13} className="animate-spin" /> Working…</> : <>Approve →</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Pricing ── */}
        {step === "pricing" && template && artworkUrl && listing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Final mockup */}
            <div>
              <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-3">/ STEP 4 — PRICING & PUBLISH /</p>
              <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex justify-center">
                <MockupCanvas
                  ref={canvasRef}
                  templateUrl={template.views.front.url}
                  artworkUrl={artworkUrl}
                  printArea={template.views.front.print_area}
                  scale={scale}
                  offsetX={offsetX}
                  offsetY={offsetY}
                  displaySize={500}
                />
              </div>
            </div>

            {/* Listing + pricing */}
            <div className="space-y-4">
              <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                <p className="font-mono text-[9px] tracking-widest text-zinc-400 mb-3">AI LISTING</p>
                <h3 className="font-black text-zinc-900 mb-2 leading-snug">{listing.listing_title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-4">{listing.listing_description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {listing.seo_tags.slice(0, 6).map((tag, i) => (
                    <span key={i} className="font-mono text-[9px] border border-zinc-200 text-zinc-500 px-2 py-0.5 rounded">#{tag}</span>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                <p className="font-mono text-[9px] tracking-widest text-zinc-400 mb-4">PRICING</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-zinc-50 rounded-xl p-3 text-center">
                    <p className="font-mono text-[9px] text-zinc-400 mb-1">COST</p>
                    <p className="font-black text-zinc-900">₹{template.base_price}</p>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-3 text-center">
                    <p className="font-mono text-[9px] text-zinc-400 mb-1">SELL</p>
                    <input type="number" value={sellPrice} onChange={e => setSellPrice(Number(e.target.value))}
                      className="w-full text-center font-black text-zinc-900 bg-transparent focus:outline-none text-base" />
                  </div>
                  <div className="bg-zinc-900 rounded-xl p-3 text-center">
                    <p className="font-mono text-[9px] text-zinc-400 mb-1">PROFIT</p>
                    <p className="font-black text-white">₹{Math.max(0, sellPrice - template.base_price)}</p>
                  </div>
                </div>
                {sellPrice > 0 && (
                  <div className="flex justify-between text-xs text-zinc-400 mb-4">
                    <span className="font-mono tracking-wider">MARGIN</span>
                    <span className="font-bold text-zinc-600">{Math.round(((sellPrice - template.base_price) / sellPrice) * 100)}%</span>
                  </div>
                )}

                <button onClick={saveProduct} disabled={saving} className="w-full bg-violet-600 text-white font-bold py-3.5 rounded-xl hover:bg-violet-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Publishing…</> : "Publish product →"}
                </button>
                <p className="font-mono text-[10px] text-zinc-400 text-center mt-2 tracking-wider">
                  GENERATES STOREFRONT MOCKUP + PRODUCTION FILE
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Layer 2 — Artwork Validation.
 *
 * SVG and vector data URIs are infinitely scalable → skip resolution check.
 * Raster formats (PNG/JPEG) must be at least 600×600 for print quality.
 */
async function validateArtwork(url: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  // SVG is vector — always passes resolution checks.
  if (url.startsWith("data:image/svg+xml") || url.includes(".svg")) {
    return { ok: true };
  }

  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // For raster images, width === 0 means the browser couldn't determine dimensions
      // (rare for PNG/JPEG, common for some SVGs). Treat as acceptable rather than rejecting.
      if (img.width === 0 || img.height === 0) {
        resolve({ ok: true });
        return;
      }
      if (img.width < 600 || img.height < 600) {
        resolve({ ok: false, reason: `Resolution too low (${img.width}×${img.height}). Minimum 600×600 for print quality.` });
        return;
      }
      resolve({ ok: true });
    };
    img.onerror = () => resolve({ ok: false, reason: "Artwork file could not be loaded." });
    img.src = url;
  });
}
