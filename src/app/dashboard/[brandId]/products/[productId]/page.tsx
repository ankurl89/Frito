"use client";

/**
 * Edit Product — full lifecycle management.
 *
 * Sections:
 *   - Header (status badge, publish/unpublish/archive/delete)
 *   - Mockup preview + replace artwork (CTA)
 *   - Product Information (name, description, category, tags)
 *   - Pricing (sell, discount, profit calc)
 *   - SEO (slug, meta title, meta description)
 *   - Activity Log (right column)
 *   - Version History (right column)
 *
 * Order protection: artwork & production file changes are blocked
 * server-side if the product has any orders.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Product, ProductVersion, ProductAuditEntry } from "@/lib/types";
import { getTemplate } from "@/lib/qikink-catalog";
import { STATUS_META } from "@/lib/product-status";
import {
  ArrowLeft, Loader2, Eye, EyeOff, Archive, Trash2, Save, ImageOff,
  Pencil, History, Activity, AlertTriangle, Copy, Plus, X,
} from "lucide-react";
import toast from "react-hot-toast";

type Tab = "details" | "history";

export default function EditProductPage() {
  const { brandId, productId } = useParams<{ brandId: string; productId: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Partial<Product>>({});
  const [versions, setVersions] = useState<ProductVersion[]>([]);
  const [audit, setAudit] = useState<ProductAuditEntry[]>([]);
  const [assets, setAssets] = useState<{ asset_type: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("details");
  const [hasChanges, setHasChanges] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const load = useCallback(async () => {
    const [pRes, vRes, aRes, asRes] = await Promise.all([
      fetch(`/api/products/${productId}`),
      fetch(`/api/products/${productId}/versions`),
      fetch(`/api/products/${productId}/audit`),
      fetch(`/api/products/${productId}/assets`),
    ]);
    const p = await pRes.json();
    if (p.error) { toast.error(p.error); return; }
    setProduct(p);
    setDraft({});
    setVersions(await vRes.json());
    setAudit(await aRes.json());
    setAssets(await asRes.json());
    setLoading(false);
    setHasChanges(false);
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const set = (k: keyof Product, v: unknown) => {
    setDraft(d => ({ ...d, [k]: v }));
    setHasChanges(true);
  };

  const merged = { ...product, ...draft } as Product;

  async function save() {
    if (!hasChanges) return;
    setSaving(true);
    const res = await fetch(`/api/products/${productId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Save failed");
      setSaving(false);
      return;
    }
    toast.success("Saved");
    await load();
    setSaving(false);
  }

  async function changeStatus(status: "draft" | "published" | "archived") {
    const res = await fetch(`/api/products/${productId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(`Product ${status}`);
      await load();
    } else {
      toast.error("Action failed");
    }
  }

  async function duplicate() {
    const res = await fetch(`/api/products/${productId}/duplicate`, { method: "POST" });
    const clone = await res.json();
    if (clone.error) { toast.error(clone.error); return; }
    toast.success("Duplicated");
    router.push(`/dashboard/${brandId}/products/${clone.id}`);
  }

  async function remove() {
    const ok = confirm(`Delete "${product?.name}"?\n\nThis action cannot be undone.\n\nIf this product has orders, it will be archived instead.`);
    if (!ok) return;
    const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.action === "archived" ? data.message : "Product deleted");
      router.push(`/dashboard/${brandId}/products`);
    }
  }

  function addTag() {
    if (!tagInput.trim()) return;
    const next = [...(merged.tags || []), tagInput.trim()];
    set("tags", next);
    setTagInput("");
  }
  function removeTag(t: string) {
    set("tags", (merged.tags || []).filter(x => x !== t));
  }

  if (loading || !product) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 size={20} className="text-zinc-300 animate-spin" />
      </div>
    );
  }

  const statusMeta = STATUS_META[product.status] || STATUS_META.draft;
  const isPublished = product.status === "published" || product.status === "active";
  const isArchived = product.status === "archived";
  const isDraft = product.status === "draft";
  const template = getTemplate(product.qikink_product_id);
  const imageUrl = merged.mockup_url || merged.artwork_url || merged.design_url;
  const margin = merged.sell_price > 0 ? Math.round(((merged.sell_price - merged.base_cost) / merged.sell_price) * 100) : 0;

  return (
    <div className="min-h-full bg-[#F5F5F0]">
      {/* Sticky header */}
      <div className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center gap-5 sticky top-0 z-20">
        <Link href={`/dashboard/${brandId}/products`} className="w-9 h-9 border border-zinc-200 rounded-xl flex items-center justify-center hover:bg-zinc-50 transition-colors">
          <ArrowLeft size={15} className="text-zinc-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-black text-zinc-900 text-lg tracking-tight truncate">{product.name}</h1>
            <span className={`font-mono text-[9px] tracking-wider border rounded px-2 py-0.5 ${statusMeta.cls}`}>{statusMeta.label}</span>
            {(product.version || 0) > 1 && (
              <span className="font-mono text-[9px] tracking-wider border border-zinc-300 text-zinc-500 px-2 py-0.5 rounded bg-white">v{product.version}</span>
            )}
          </div>
          <p className="font-mono text-[10px] tracking-widest text-zinc-400">{product.sku} · {product.category}</p>
        </div>

        <div className="flex items-center gap-2">
          {isDraft && (
            <button onClick={() => changeStatus("published")} className="flex items-center gap-1.5 text-sm font-bold bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors">
              <Eye size={13} /> Publish
            </button>
          )}
          {isPublished && (
            <button onClick={() => changeStatus("draft")} className="flex items-center gap-1.5 text-sm font-bold border-2 border-zinc-300 text-zinc-700 px-4 py-2 rounded-xl hover:border-zinc-500 transition-colors">
              <EyeOff size={13} /> Unpublish
            </button>
          )}
          {isArchived && (
            <button onClick={() => changeStatus("published")} className="flex items-center gap-1.5 text-sm font-bold bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors">
              <Eye size={13} /> Restore
            </button>
          )}
          {!isArchived && (
            <button onClick={() => changeStatus("archived")} className="w-9 h-9 border border-zinc-200 rounded-xl flex items-center justify-center hover:bg-amber-50 hover:border-amber-300 transition-colors" title="Archive">
              <Archive size={14} className="text-amber-600" />
            </button>
          )}
          <button onClick={duplicate} className="w-9 h-9 border border-zinc-200 rounded-xl flex items-center justify-center hover:bg-zinc-50 transition-colors" title="Duplicate">
            <Copy size={14} className="text-zinc-600" />
          </button>
          <button onClick={remove} className="w-9 h-9 border border-zinc-200 rounded-xl flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-colors" title="Delete">
            <Trash2 size={14} className="text-red-500" />
          </button>
          <div className="w-px h-7 bg-zinc-200 mx-1" />
          <button
            onClick={save}
            disabled={!hasChanges || saving}
            className="flex items-center gap-1.5 text-sm font-bold bg-zinc-900 text-white px-5 py-2 rounded-xl hover:bg-violet-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <><Loader2 size={13} className="animate-spin" /> Saving</> : <><Save size={13} /> Save changes</>}
          </button>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Edit form ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Mockup + replace artwork */}
          <Section title="MOCKUP">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="aspect-square bg-zinc-50 rounded-xl flex items-center justify-center overflow-hidden border border-zinc-100">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt={product.name} className={merged.mockup_url ? "w-full h-full object-cover" : "w-full h-full object-contain p-4"} />
                ) : (
                  <ImageOff size={28} className="text-zinc-200" />
                )}
              </div>
              <div className="sm:col-span-2 space-y-3">
                <div className="bg-zinc-50 rounded-xl p-4">
                  <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-2">PRODUCT TEMPLATE</p>
                  <p className="font-bold text-sm text-zinc-900">{product.qikink_product_name}</p>
                  {template && (
                    <p className="text-xs text-zinc-500 mt-0.5">{template.material}</p>
                  )}
                </div>
                <Link
                  href={`/dashboard/${brandId}/products/${productId}/artwork`}
                  className="flex items-center gap-2 justify-center w-full border-2 border-zinc-900 text-zinc-900 font-bold text-sm py-3 rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  <Pencil size={13} /> Replace artwork
                </Link>
                <p className="font-mono text-[9px] text-zinc-400 text-center tracking-wider">
                  REGENERATES MOCKUP + PRODUCTION FILE
                </p>
              </div>
            </div>
          </Section>

          {/* PVE: generated assets + visualization score */}
          {(assets.length > 0 || product.visualization_score != null) && (
            <Section title="PRODUCT VISUALIZATION">
              {product.visualization_score != null && (
                <ScoreBar
                  score={product.visualization_score}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  report={(product as any).validation_report}
                />
              )}
              {assets.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {["primary", "closeup", "thumbnail", "production_file"].map(type => {
                    const a = assets.find(x => x.asset_type === type);
                    if (!a) return null;
                    return (
                      <div key={type}>
                        <div className="aspect-square bg-zinc-50 rounded-xl overflow-hidden border border-zinc-100 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={a.url} alt={type} className="w-full h-full object-cover" />
                          {type === "production_file" && (
                            <div className="absolute inset-0 bg-[length:16px_16px] bg-[linear-gradient(45deg,#f4f4f5_25%,transparent_25%,transparent_75%,#f4f4f5_75%),linear-gradient(45deg,#f4f4f5_25%,white_25%,white_75%,#f4f4f5_75%)] bg-[position:0_0,8px_8px] -z-10" />
                          )}
                        </div>
                        <p className="font-mono text-[9px] tracking-widest text-zinc-400 mt-1.5 text-center">
                          {type.replace("_", " ").toUpperCase()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          )}

          {/* Product information */}
          <Section title="PRODUCT INFORMATION">
            <Field label="NAME">
              <input value={merged.name || ""} onChange={e => set("name", e.target.value)} className={inputCls} />
            </Field>
            <Field label="LISTING TITLE">
              <input value={merged.listing_title || ""} onChange={e => set("listing_title", e.target.value)} className={inputCls} />
            </Field>
            <Field label="DESCRIPTION">
              <textarea
                value={merged.listing_description || ""}
                onChange={e => set("listing_description", e.target.value)}
                rows={5}
                className={`${inputCls} resize-none leading-relaxed`}
              />
            </Field>
            <Field label="TAGS">
              <div className="flex flex-wrap gap-2 mb-2">
                {(merged.tags || []).map(t => (
                  <span key={t} className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {t}
                    <button onClick={() => removeTag(t)} className="hover:text-red-500 transition-colors"><X size={10} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Add a tag and press Enter"
                  className={inputCls}
                />
                <button onClick={addTag} className="bg-zinc-900 text-white text-sm font-bold px-3 rounded-xl hover:bg-zinc-700 transition-colors flex items-center gap-1">
                  <Plus size={13} />
                </button>
              </div>
            </Field>
            <Field label="SEO TAGS">
              <div className="flex flex-wrap gap-1.5">
                {(merged.seo_tags || []).map((t, i) => (
                  <span key={i} className="font-mono text-[10px] border border-zinc-200 text-zinc-500 px-2 py-0.5 rounded">#{t}</span>
                ))}
                {!merged.seo_tags?.length && <span className="text-xs text-zinc-400">None</span>}
              </div>
            </Field>
          </Section>

          {/* Pricing */}
          <Section title="PRICING">
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-zinc-50 rounded-xl p-3 text-center">
                <p className="font-mono text-[9px] text-zinc-400 mb-1">COST</p>
                <p className="font-black text-zinc-900">₹{merged.base_cost}</p>
              </div>
              <div className="bg-zinc-50 rounded-xl p-3 text-center">
                <p className="font-mono text-[9px] text-zinc-400 mb-1">SELL</p>
                <input
                  type="number"
                  value={merged.sell_price || 0}
                  onChange={e => set("sell_price", Number(e.target.value))}
                  className="w-full text-center font-black text-zinc-900 bg-transparent focus:outline-none text-base"
                />
              </div>
              <div className="bg-zinc-50 rounded-xl p-3 text-center">
                <p className="font-mono text-[9px] text-zinc-400 mb-1">DISCOUNT</p>
                <input
                  type="number"
                  value={merged.discount_price || 0}
                  onChange={e => set("discount_price", Number(e.target.value) || null)}
                  className="w-full text-center font-black text-zinc-900 bg-transparent focus:outline-none text-base"
                />
              </div>
              <div className="bg-zinc-900 rounded-xl p-3 text-center">
                <p className="font-mono text-[9px] text-zinc-400 mb-1">PROFIT</p>
                <p className="font-black text-white">₹{Math.max(0, merged.sell_price - merged.base_cost)}</p>
              </div>
            </div>
            <div className="flex justify-between text-xs mt-3 text-zinc-400">
              <span className="font-mono tracking-wider">MARGIN</span>
              <span className="font-bold text-zinc-600">{margin}%</span>
            </div>
          </Section>

          {/* SEO */}
          <Section title="SEO">
            <Field label="URL SLUG">
              <input
                value={merged.url_slug || ""}
                onChange={e => set("url_slug", e.target.value.replace(/[^a-z0-9-]/gi, "-").toLowerCase())}
                placeholder="my-awesome-tee"
                className={inputCls}
              />
            </Field>
            <Field label="META TITLE">
              <input
                value={merged.meta_title || ""}
                onChange={e => set("meta_title", e.target.value)}
                placeholder="Shows in search results"
                maxLength={70}
                className={inputCls}
              />
              <p className="font-mono text-[9px] text-zinc-400 mt-1 tracking-wider">{(merged.meta_title || "").length}/70</p>
            </Field>
            <Field label="META DESCRIPTION">
              <textarea
                value={merged.meta_description || ""}
                onChange={e => set("meta_description", e.target.value)}
                placeholder="Shows in search results below the title"
                rows={3}
                maxLength={160}
                className={`${inputCls} resize-none`}
              />
              <p className="font-mono text-[9px] text-zinc-400 mt-1 tracking-wider">{(merged.meta_description || "").length}/160</p>
            </Field>
          </Section>

          {/* Danger zone — order protection notice */}
          <Section title="DANGER ZONE">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-bold text-amber-900 mb-1">Order protection</p>
                <p className="text-amber-800 text-xs leading-relaxed">
                  Once this product has any orders, the artwork and production files become locked to protect fulfillment.
                  You can still edit pricing, listing, and SEO. To make design changes after that, duplicate this product.
                </p>
              </div>
            </div>
          </Section>
        </div>

        {/* ── RIGHT: History tabs ── */}
        <div className="space-y-5">
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
            <div className="flex border-b border-zinc-100">
              <TabButton active={tab === "details"} onClick={() => setTab("details")} icon={<Activity size={13} />} label="ACTIVITY" />
              <TabButton active={tab === "history"} onClick={() => setTab("history")} icon={<History size={13} />} label="VERSIONS" />
            </div>

            {tab === "details" && (
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {audit.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-6">No activity yet</p>
                ) : (
                  audit.map(entry => (
                    <div key={entry.id} className="border-l-2 border-zinc-200 pl-3">
                      <p className="font-mono text-[10px] tracking-widest text-violet-600 font-bold">{entry.action.toUpperCase()}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">{summariseAudit(entry)}</p>
                      <p className="font-mono text-[10px] text-zinc-400 mt-1">{new Date(entry.created_at).toLocaleString("en-IN")}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "history" && (
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {versions.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-6">No versions yet</p>
                ) : (
                  versions.map(v => (
                    <div key={v.id} className="border-l-2 border-violet-200 pl-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-black text-zinc-900">v{v.version}</span>
                        <span className="font-mono text-[9px] tracking-wider bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">{v.change_type.toUpperCase()}</span>
                      </div>
                      {v.change_summary && <p className="text-xs text-zinc-600">{v.change_summary}</p>}
                      <p className="font-mono text-[10px] text-zinc-400 mt-1">{new Date(v.created_at).toLocaleString("en-IN")}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all";

interface ScoreReport {
  validation?: { issues?: { level: string; message: string }[] };
  score?: { factors?: { label: string; score: number; max: number }[]; publishable?: boolean; threshold?: number };
}
function ScoreBar({ score, report }: { score: number; report?: ScoreReport }) {
  const threshold = report?.score?.threshold ?? 82;
  const publishable = report?.score?.publishable ?? (score >= threshold);
  const tone = publishable ? "text-green-600" : score >= threshold - 20 ? "text-amber-600" : "text-red-600";
  const barTone = publishable ? "bg-green-500" : score >= threshold - 20 ? "bg-amber-500" : "bg-red-500";
  const factors = report?.score?.factors || [];
  const issues = (report?.validation?.issues || []).filter(i => i.level !== "info");

  return (
    <div className="bg-zinc-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-black ${tone}`}>{score}</span>
          <span className="text-zinc-400 font-mono text-xs">/100 · NEEDS {threshold}+ FOR THIS PRODUCT</span>
        </div>
        <span className={`font-mono text-[9px] tracking-wider border rounded px-2 py-0.5 ${
          publishable ? "border-green-300 text-green-700 bg-green-50" : "border-amber-300 text-amber-700 bg-amber-50"
        }`}>
          {publishable ? "PUBLISHABLE" : "BELOW THRESHOLD"}
        </span>
      </div>
      <div className="h-2 bg-zinc-200 rounded-full overflow-hidden mb-3 relative">
        <div className={`h-2 rounded-full ${barTone}`} style={{ width: `${score}%` }} />
        {/* threshold marker */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-zinc-900/40" style={{ left: `${threshold}%` }} title={`Threshold ${threshold}`} />
      </div>
      {factors.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
          {factors.map(f => (
            <div key={f.label} className="text-center">
              <p className="font-black text-sm text-zinc-900">{f.score}<span className="text-zinc-400 text-[10px]">/{f.max}</span></p>
              <p className="font-mono text-[8px] tracking-wider text-zinc-400 leading-tight mt-0.5">{f.label.toUpperCase()}</p>
            </div>
          ))}
        </div>
      )}
      {issues.length > 0 && (
        <div className="space-y-1 mt-2 pt-2 border-t border-zinc-200">
          {issues.map((i, idx) => (
            <p key={idx} className={`text-xs flex items-start gap-1.5 ${i.level === "error" ? "text-red-600" : "text-amber-600"}`}>
              <span className="flex-shrink-0">{i.level === "error" ? "✕" : "⚠"}</span> {i.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-6">
      <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-4">{title}</p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-[10px] tracking-widest text-zinc-400 mb-2 uppercase">{label}</label>
      {children}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-3 font-mono text-[10px] tracking-widest font-bold transition-colors ${
        active ? "text-zinc-900 bg-zinc-50" : "text-zinc-400 hover:text-zinc-600"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function summariseAudit(e: ProductAuditEntry): string {
  const d = e.details || {};
  if (e.action === "create") return `Created as ${d.status || "draft"}`;
  if (e.action === "duplicate") return `Duplicated from "${d.source_name || "another product"}"`;
  if (e.action === "publish") return "Made visible to customers";
  if (e.action === "unpublish") return "Removed from storefront";
  if (e.action === "archive") return (d.reason as string) || "Archived";
  if (e.action === "artwork") return "Artwork replaced";
  if (e.action === "pricing") return "Pricing updated";
  if (e.action === "edit" && Array.isArray(d.fields)) return `Updated: ${(d.fields as string[]).join(", ")}`;
  return e.action;
}
