"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QIKINK_CATALOG, CATEGORIES, suggestSellPrice } from "@/lib/qikink-catalog";
import { QikinkProduct, BrandDNA } from "@/lib/types";
import { ArrowLeft, Check, Loader2, ImageOff, Pencil, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

type Step = "pick_product" | "design" | "pricing";

export default function NewProductPage() {
  const { brandId } = useParams<{ brandId: string }>();
  const router = useRouter();
  const [step, setStep] = useState<Step>("pick_product");
  const [brand, setBrand] = useState<BrandDNA | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<QikinkProduct | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [designDescription, setDesignDescription] = useState("");
  const [designUrl, setDesignUrl] = useState<string | null>(null);
  const [designConcept, setDesignConcept] = useState("");
  const [designPrompt, setDesignPrompt] = useState("");
  const [generatingDesign, setGeneratingDesign] = useState(false);
  const [sellPrice, setSellPrice] = useState(0);
  const [listing, setListing] = useState<{ listing_title: string; listing_description: string; seo_tags: string[] } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/brands/${brandId}`).then(r => r.json()).then(setBrand);
  }, [brandId]);

  const filteredProducts = selectedCategory === "All"
    ? QIKINK_CATALOG
    : QIKINK_CATALOG.filter(p => p.category === selectedCategory);

  async function generateDesign() {
    if (!brand || !selectedProduct) return;
    setGeneratingDesign(true);
    setDesignUrl(null);
    try {
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandDNA: brand, productName: selectedProduct.name, productCategory: selectedProduct.category, userDescription: designDescription }),
      });
      const data = await res.json();
      setDesignUrl(data.url);
      setDesignPrompt(data.prompt);
      setDesignConcept(data.concept || "");

      const listingRes = await fetch("/api/ai/listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandDNA: brand, productName: selectedProduct.name, productCategory: selectedProduct.category, designDescription: data.concept || data.prompt }),
      });
      const listingData = await listingRes.json();
      setListing(listingData);
      setSellPrice(suggestSellPrice(selectedProduct.base_price, brand.price_tier));
      setStep("pricing");
    } catch {
      toast.error("Design generation failed. Try again.");
    } finally {
      setGeneratingDesign(false);
    }
  }

  async function saveProduct() {
    if (!brand || !selectedProduct || !listing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: brandId,
          name: selectedProduct.name,
          description: listing.listing_description,
          category: selectedProduct.category,
          qikink_product_id: selectedProduct.id,
          qikink_product_name: selectedProduct.name,
          base_cost: selectedProduct.base_price,
          sell_price: sellPrice,
          design_prompt: designPrompt,
          design_url: designUrl,
          variants: selectedProduct.available_sizes.map(s => ({ size: s, price: sellPrice })),
          listing_title: listing.listing_title,
          listing_description: listing.listing_description,
          seo_tags: listing.seo_tags,
          status: "active",
        }),
      });
      const product = await res.json();
      if (product.error) throw new Error(product.error);
      toast.success("Product added!");
      router.push(`/dashboard/${brandId}/products`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  const steps: { key: Step; label: string }[] = [
    { key: "pick_product", label: "CHOOSE" },
    { key: "design", label: "DESIGN" },
    { key: "pricing", label: "PRICING" },
  ];
  const stepIdx = steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-full bg-[#F5F5F0]">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-8 py-5 flex items-center gap-5 sticky top-0 z-10">
        <Link href={`/dashboard/${brandId}/products`} className="w-9 h-9 border border-zinc-200 rounded-xl flex items-center justify-center hover:bg-zinc-50 transition-colors">
          <ArrowLeft size={15} className="text-zinc-600" />
        </Link>
        <div>
          <h1 className="font-black text-zinc-900 text-lg tracking-tight">Add Product</h1>
          <p className="font-mono text-[10px] tracking-widest text-zinc-400">AI DESIGNS IT TO MATCH YOUR BRAND</p>
        </div>

        {/* Step tracker */}
        <div className="ml-auto flex items-center gap-3">
          {steps.map((s, i) => {
            const done = stepIdx > i;
            const active = stepIdx === i;
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${done ? "bg-green-500" : active ? "bg-zinc-900" : "bg-zinc-100"}`}>
                  {done
                    ? <Check size={11} className="text-white" />
                    : <span className={`font-mono text-[10px] font-bold ${active ? "text-white" : "text-zinc-400"}`}>{i + 1}</span>
                  }
                </div>
                <span className={`font-mono text-[10px] tracking-widest hidden md:block ${active ? "text-zinc-900 font-bold" : "text-zinc-400"}`}>{s.label}</span>
                {i < steps.length - 1 && <div className="w-6 h-px bg-zinc-200 ml-1" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto">

        {/* ── STEP 1: Pick product ── */}
        {step === "pick_product" && (
          <div>
            <div className="mb-6">
              <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-3">/ CATALOG /</p>
              <div className="flex gap-2 flex-wrap">
                {["All", ...CATEGORIES].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${selectedCategory === cat ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={`bg-white border rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                    selectedProduct?.id === product.id
                      ? "border-zinc-900 ring-2 ring-zinc-900 shadow-md"
                      : "border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  <div className="aspect-square bg-zinc-50 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    {selectedProduct?.id === product.id && (
                      <div className="absolute inset-0 bg-zinc-900/10 flex items-center justify-center">
                        <div className="w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-xs text-zinc-900 truncate">{product.name}</p>
                    <p className="font-mono text-[10px] text-zinc-400 mt-0.5">from ₹{product.base_price}</p>
                  </div>
                </div>
              ))}
            </div>

            {selectedProduct && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-zinc-900 text-white rounded-2xl px-6 py-4 flex items-center gap-5 shadow-2xl">
                  <div>
                    <p className="font-bold text-sm">{selectedProduct.name}</p>
                    <p className="font-mono text-[10px] text-zinc-400">base cost ₹{selectedProduct.base_price}</p>
                  </div>
                  <button
                    onClick={() => setStep("design")}
                    className="bg-violet-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-violet-500 transition-colors flex items-center gap-2"
                  >
                    <Sparkles size={13} /> Design with AI
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Design ── */}
        {step === "design" && selectedProduct && (
          <div className="max-w-lg mx-auto">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-5">
              <div className="flex items-center gap-3 mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-16 h-16 object-cover rounded-xl border border-zinc-100" />
                <div>
                  <p className="font-black text-zinc-900">{selectedProduct.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedProduct.available_colors.slice(0, 4).map(c => (
                      <span key={c} className="font-mono text-[9px] border border-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded">{c}</span>
                    ))}
                  </div>
                </div>
              </div>

              <label className="block font-mono text-[10px] tracking-widest text-zinc-400 mb-2">
                DESCRIBE YOUR DESIGN <span className="text-zinc-300">(OPTIONAL)</span>
              </label>
              <textarea
                value={designDescription}
                onChange={e => setDesignDescription(e.target.value)}
                placeholder={`E.g. "A bold graphic with ${brand?.name || "brand"} colors and a streetwear feel" — or leave empty and let AI decide`}
                rows={3}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />

              <button
                onClick={generateDesign}
                disabled={generatingDesign}
                className="w-full mt-4 bg-zinc-900 text-white font-bold py-3.5 rounded-xl hover:bg-violet-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generatingDesign
                  ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                  : <><Sparkles size={14} /> Generate AI Design</>
                }
              </button>
            </div>

            {generatingDesign && (
              <div className="bg-zinc-900 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={20} className="text-white animate-pulse" />
                </div>
                <p className="font-black text-white mb-1">Creating your design…</p>
                <p className="font-mono text-[10px] tracking-widest text-zinc-500">TAKES ABOUT 15–20 SECONDS</p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Pricing ── */}
        {step === "pricing" && selectedProduct && listing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Design preview */}
            <div>
              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                <div className="aspect-square bg-zinc-50 flex items-center justify-center p-6">
                  {designUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={designUrl} alt="Generated design" className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-300">
                      <ImageOff size={28} />
                      <span className="font-mono text-[10px]">NO IMAGE</span>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-zinc-100">
                  {designConcept && (
                    <div className="mb-3">
                      <p className="font-mono text-[9px] tracking-widest text-zinc-400 mb-1">AI CONCEPT</p>
                      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">{designConcept}</p>
                    </div>
                  )}
                  <button
                    onClick={() => setStep("design")}
                    className="flex items-center gap-1.5 text-xs text-violet-600 font-semibold hover:underline"
                  >
                    <Pencil size={10} /> Regenerate with different direction
                  </button>
                </div>
              </div>
            </div>

            {/* Listing + pricing */}
            <div className="space-y-4">
              {/* Listing */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                <p className="font-mono text-[9px] tracking-widest text-zinc-400 mb-3">AI-GENERATED LISTING</p>
                <h3 className="font-black text-zinc-900 mb-2 leading-snug">{listing.listing_title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-4">{listing.listing_description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {listing.seo_tags.slice(0, 6).map((tag, i) => (
                    <span key={i} className="font-mono text-[9px] border border-zinc-200 text-zinc-500 px-2 py-0.5 rounded">#{tag}</span>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5">
                <p className="font-mono text-[9px] tracking-widest text-zinc-400 mb-4">PRICING</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-zinc-50 rounded-xl p-3 text-center">
                    <p className="font-mono text-[9px] text-zinc-400 mb-1">COST</p>
                    <p className="font-black text-zinc-900">₹{selectedProduct.base_price}</p>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-3 text-center">
                    <p className="font-mono text-[9px] text-zinc-400 mb-1">SELL</p>
                    <input
                      type="number"
                      value={sellPrice}
                      onChange={e => setSellPrice(Number(e.target.value))}
                      className="w-full text-center font-black text-zinc-900 bg-transparent focus:outline-none text-base"
                    />
                  </div>
                  <div className="bg-zinc-900 rounded-xl p-3 text-center">
                    <p className="font-mono text-[9px] text-zinc-400 mb-1">PROFIT</p>
                    <p className="font-black text-white">₹{Math.max(0, sellPrice - selectedProduct.base_price)}</p>
                  </div>
                </div>

                {sellPrice > 0 && (
                  <div className="flex justify-between text-xs text-zinc-400 mb-4">
                    <span className="font-mono tracking-wider">MARGIN</span>
                    <span className="font-bold text-zinc-600">
                      {Math.round(((sellPrice - selectedProduct.base_price) / sellPrice) * 100)}%
                    </span>
                  </div>
                )}

                <button
                  onClick={saveProduct}
                  disabled={saving}
                  className="w-full bg-violet-600 text-white font-bold py-3.5 rounded-xl hover:bg-violet-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving
                    ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                    : "Add to my brand →"
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
