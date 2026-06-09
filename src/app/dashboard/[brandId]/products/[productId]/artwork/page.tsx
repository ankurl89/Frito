"use client";

/**
 * Replace Artwork — re-runs Layers 2 & 3 of the Mockup System on an existing product.
 *
 * Same flow as the new-product preview step, but starts from the existing product
 * and writes back to it. On approve, regenerates the mockup PNG + production file
 * and PATCHes the product.
 *
 * Server-side, the PATCH on artwork_url is blocked if the product has any orders.
 */

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Product, BrandDNA } from "@/lib/types";
import { getTemplate } from "@/lib/qikink-catalog";
import { ArrowLeft, Loader2, Sparkles, Upload, AlertTriangle } from "lucide-react";
import MockupCanvas, { MockupCanvasHandle } from "@/components/MockupCanvas";
import toast from "react-hot-toast";

export default function ReplaceArtworkPage() {
  const { brandId, productId } = useParams<{ brandId: string; productId: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [brand, setBrand] = useState<BrandDNA | null>(null);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [aiDescription, setAiDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<MockupCanvasHandle>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${productId}`).then(r => r.json()),
      fetch(`/api/brands/${brandId}`).then(r => r.json()),
    ]).then(([p, b]) => {
      setProduct(p);
      setBrand(b);
      setArtworkUrl(p.artwork_url || p.design_url || null);
      if (p.placement) {
        setScale(p.placement.scale || 1);
        setOffsetX(p.placement.offset_x || 0);
        setOffsetY(p.placement.offset_y || 0);
      }
    });
  }, [brandId, productId]);

  const template = product ? getTemplate(product.qikink_product_id) : null;

  async function generateArtwork() {
    if (!brand || !product || !template) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/design", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandDNA: brand, productName: template.name,
          productCategory: template.category, userDescription: aiDescription,
        }),
      });
      const data = await res.json();
      if (!data.url) throw new Error(data.error || "Generation failed");
      setArtworkUrl(data.url);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setArtworkUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function saveAndRegenerate() {
    if (!product || !template || !artworkUrl) return;
    setSaving(true);
    setError(null);
    try {
      // Order protection: PATCH artwork first (server returns 409 if order-locked).
      const patchRes = await fetch(`/api/products/${productId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artwork_url: artworkUrl,
          design_url: artworkUrl,
          placement: { scale, offset_x: offsetX, offset_y: offsetY },
        }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok) {
        setError(patchData.error || "Could not save");
        setSaving(false);
        return;
      }

      // Re-run the PVE pipeline → regenerates all assets + production file + score.
      const renderRes = await fetch("/api/pve/render", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          productTemplateId: product.qikink_product_id,
          artwork: artworkUrl,
          placement: { scale, offset_x: offsetX, offset_y: offsetY },
          brandPalette: brand?.palette,
        }),
      });
      const renderData = await renderRes.json();
      if (!renderRes.ok) {
        setError(renderData.error || "Asset regeneration failed");
        setSaving(false);
        return;
      }

      toast.success(`Artwork replaced · score ${renderData.score?.total ?? "—"}/100`);
      router.push(`/dashboard/${brandId}/products/${productId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  if (!product || !template) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 size={20} className="text-zinc-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F5F5F0]">
      <div className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center gap-5 sticky top-0 z-10">
        <Link href={`/dashboard/${brandId}/products/${productId}`} className="w-9 h-9 border border-zinc-200 rounded-xl flex items-center justify-center hover:bg-zinc-50 transition-colors">
          <ArrowLeft size={15} className="text-zinc-600" />
        </Link>
        <div>
          <h1 className="font-black text-zinc-900 text-lg tracking-tight">Replace artwork — {product.name}</h1>
          <p className="font-mono text-[10px] tracking-widest text-zinc-400">AUTO-REGENERATES MOCKUP + PRODUCTION FILE</p>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm text-red-900">Cannot save changes</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Mockup preview */}
          <div className="md:col-span-3">
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

          {/* Controls */}
          <div className="md:col-span-2 space-y-4">
            {/* Artwork source */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-3">NEW ARTWORK</p>

              <label className="block bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-xl p-4 text-center hover:border-violet-400 transition-colors cursor-pointer mb-3">
                <input type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden" onChange={handleUpload} />
                <Upload size={16} className="mx-auto text-zinc-400 mb-1" />
                <p className="text-xs font-bold text-zinc-900">Upload file</p>
              </label>

              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-zinc-200" />
                <span className="font-mono text-[10px] text-zinc-400 tracking-widest">OR</span>
                <div className="flex-1 h-px bg-zinc-200" />
              </div>

              <textarea
                value={aiDescription}
                onChange={e => setAiDescription(e.target.value)}
                placeholder="Describe new artwork…"
                rows={2}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
              <button onClick={generateArtwork} disabled={generating} className="w-full mt-2 bg-zinc-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-violet-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                {generating ? <><Loader2 size={11} className="animate-spin" /> Generating</> : <><Sparkles size={11} /> Generate with AI</>}
              </button>
            </div>

            {/* Placement */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-4">PLACEMENT</p>
              <div className="space-y-3">
                <Slider label="SCALE" min={0.3} max={1} step={0.05} value={scale} display={`${Math.round(scale * 100)}%`} onChange={setScale} />
                <Slider label="HORIZONTAL" min={-50} max={50} step={1} value={offsetX} display={`${offsetX}px`} onChange={setOffsetX} />
                <Slider label="VERTICAL" min={-50} max={50} step={1} value={offsetY} display={`${offsetY}px`} onChange={setOffsetY} />
              </div>
            </div>

            <button onClick={saveAndRegenerate} disabled={saving || !artworkUrl} className="w-full bg-violet-600 text-white font-bold py-3.5 rounded-xl hover:bg-violet-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Regenerating…</> : "Save and regenerate →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, min, max, step, value, display, onChange }: {
  label: string; min: number; max: number; step: number; value: number; display: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-mono text-zinc-500 tracking-wider">{label}</span>
        <span className="font-black text-zinc-900">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-violet-600" />
    </div>
  );
}
