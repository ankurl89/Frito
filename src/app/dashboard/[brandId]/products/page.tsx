"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Product } from "@/lib/types";
import { STATUS_META } from "@/lib/product-status";
import { Plus, ImageOff, Search, MoreVertical, Copy, Archive, Trash2, Eye, EyeOff, Pencil, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type Tab = "all" | "draft" | "published" | "archived";
type Sort = "created_at" | "sell_price" | "name";

export default function ProductsPage() {
  const { brandId } = useParams<{ brandId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ all: 0, draft: 0, published: 0, archived: 0 });
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("created_at");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const url = `/api/products?brand_id=${brandId}` +
      (tab !== "all" ? `&status=${tab}` : "") +
      (search ? `&q=${encodeURIComponent(search)}` : "") +
      `&sort=${sort}`;
    const res = await fetch(url);
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);

    // Also fetch totals for tabs (separate call without filter for count)
    if (tab === "all") {
      const all = data as Product[];
      setCounts({
        all: all.length,
        draft: all.filter(p => p.status === "draft").length,
        published: all.filter(p => p.status === "published" || p.status === "active").length,
        archived: all.filter(p => p.status === "archived").length,
      });
    }
    setLoading(false);
  }, [brandId, tab, search, sort]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  async function publish(p: Product) {
    setMenuOpen(null);
    await fetch(`/api/products/${p.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });
    toast.success("Product published");
    loadProducts();
  }

  async function unpublish(p: Product) {
    setMenuOpen(null);
    await fetch(`/api/products/${p.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "draft" }),
    });
    toast.success("Product unpublished");
    loadProducts();
  }

  async function archive(p: Product) {
    setMenuOpen(null);
    await fetch(`/api/products/${p.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    toast.success("Product archived");
    loadProducts();
  }

  async function duplicate(p: Product) {
    setMenuOpen(null);
    const res = await fetch(`/api/products/${p.id}/duplicate`, { method: "POST" });
    const clone = await res.json();
    if (clone.error) { toast.error(clone.error); return; }
    toast.success(`Duplicated as "${clone.name}"`);
    loadProducts();
  }

  async function remove(p: Product) {
    setMenuOpen(null);
    const ok = confirm(`Delete "${p.name}"?\n\nThis action cannot be undone.\n\nIf this product has orders, it will be archived instead.`);
    if (!ok) return;

    setDeleting(p.id);
    const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.action === "archived" ? data.message : "Product deleted");
    } else {
      toast.error(data.error || "Delete failed");
    }
    setDeleting(null);
    loadProducts();
  }

  return (
    <div className="p-8" onClick={() => setMenuOpen(null)}>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-2">/ YOUR PRODUCTS /</p>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Products</h1>
        </div>
        <Link
          href={`/dashboard/${brandId}/products/new`}
          className="flex items-center gap-2 bg-zinc-900 text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-violet-600 transition-colors"
        >
          <Plus size={14} /> Add Product
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-zinc-200">
        {(["all", "draft", "published", "archived"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 font-mono text-[11px] tracking-widest font-semibold transition-colors border-b-2 -mb-px ${
              tab === t ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {t.toUpperCase()}
            {tab === "all" && counts[t] > 0 && (
              <span className="ml-1.5 text-[10px] text-zinc-400 font-mono font-normal">({counts[t]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as Sort)}
          className="bg-white border border-zinc-200 rounded-xl text-sm font-medium px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="created_at">Newest first</option>
          <option value="sell_price">Price (high → low)</option>
          <option value="name">Name (A → Z)</option>
        </select>
      </div>

      {/* List / Grid */}
      {loading ? (
        <div className="text-center py-24">
          <Loader2 size={20} className="text-zinc-300 mx-auto animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState brandId={brandId} tab={tab} search={search} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              brandId={brandId}
              menuOpen={menuOpen === p.id}
              setMenuOpen={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
              deleting={deleting === p.id}
              onPublish={() => publish(p)}
              onUnpublish={() => unpublish(p)}
              onArchive={() => archive(p)}
              onDuplicate={() => duplicate(p)}
              onDelete={() => remove(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product, brandId, menuOpen, setMenuOpen, deleting,
  onPublish, onUnpublish, onArchive, onDuplicate, onDelete,
}: {
  product: Product;
  brandId: string;
  menuOpen: boolean;
  setMenuOpen: () => void;
  deleting: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const isPublished = product.status === "published" || product.status === "active";
  const isArchived = product.status === "archived";
  const isDraft = product.status === "draft";
  const statusMeta = STATUS_META[product.status] || STATUS_META.draft;
  const imageUrl = product.mockup_url || product.artwork_url || product.design_url;

  return (
    <div className={`bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-zinc-300 transition-all relative ${deleting ? "opacity-50" : ""}`}>
      {/* Image */}
      <Link href={`/dashboard/${brandId}/products/${product.id}`} className="block">
        <div className="aspect-square bg-zinc-50 flex items-center justify-center relative overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={product.name} className={product.mockup_url ? "w-full h-full object-cover" : "w-full h-full object-contain p-6"} />
          ) : (
            <ImageOff size={28} className="text-zinc-200" />
          )}
          <div className="absolute top-3 left-3">
            <span className={`font-mono text-[9px] tracking-wider border rounded px-2 py-0.5 ${statusMeta.cls}`}>{statusMeta.label}</span>
          </div>
          {product.version && product.version > 1 && (
            <div className="absolute top-3 right-3 bg-zinc-900/80 text-white font-mono text-[9px] tracking-wider px-2 py-0.5 rounded">v{product.version}</div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/dashboard/${brandId}/products/${product.id}`} className="block flex-1 min-w-0">
            <p className="font-mono text-[9px] tracking-widest text-zinc-400 mb-1">{product.category} · {product.sku}</p>
            <h3 className="font-black text-zinc-900 truncate">{product.name}</h3>
          </Link>

          {/* Actions menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(); }}
              className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center transition-colors"
            >
              <MoreVertical size={14} className="text-zinc-500" />
            </button>
            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-9 z-30 bg-white border border-zinc-200 rounded-xl shadow-xl py-1 min-w-[180px]"
              >
                <Link
                  href={`/dashboard/${brandId}/products/${product.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 transition-colors"
                >
                  <Pencil size={13} className="text-zinc-500" /> Edit product
                </Link>
                {isDraft && (
                  <button onClick={onPublish} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 transition-colors">
                    <Eye size={13} className="text-green-500" /> Publish
                  </button>
                )}
                {isPublished && (
                  <button onClick={onUnpublish} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 transition-colors">
                    <EyeOff size={13} className="text-zinc-500" /> Unpublish
                  </button>
                )}
                {!isArchived && (
                  <button onClick={onArchive} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 transition-colors">
                    <Archive size={13} className="text-amber-600" /> Archive
                  </button>
                )}
                {isArchived && (
                  <button onClick={onPublish} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 transition-colors">
                    <Eye size={13} className="text-green-500" /> Restore
                  </button>
                )}
                <button onClick={onDuplicate} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 transition-colors">
                  <Copy size={13} className="text-zinc-500" /> Duplicate
                </button>
                <div className="border-t border-zinc-100 my-1" />
                <button onClick={onDelete} className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600 transition-colors">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: "COST", value: `₹${product.base_cost}`, dark: false },
            { label: "SELL", value: `₹${product.sell_price}`, dark: false },
            { label: "PROFIT", value: `₹${(product.sell_price - product.base_cost).toFixed(0)}`, dark: true },
          ].map(col => (
            <div key={col.label} className={`rounded-lg p-2 text-center ${col.dark ? "bg-zinc-900 text-white" : "bg-zinc-50 text-zinc-600"}`}>
              <p className="font-mono text-[8px] tracking-widest opacity-60 mb-0.5">{col.label}</p>
              <p className="font-black text-sm">{col.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ brandId, tab, search }: { brandId: string; tab: Tab; search: string }) {
  if (search) {
    return (
      <div className="text-center py-24 bg-white border border-zinc-200 rounded-2xl">
        <Search size={28} className="text-zinc-200 mx-auto mb-3" />
        <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-2">NO MATCHES</p>
        <p className="text-sm text-zinc-500">No products match &ldquo;{search}&rdquo;</p>
      </div>
    );
  }
  return (
    <div className="text-center py-24 bg-white border border-zinc-200 rounded-2xl">
      <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <ImageOff size={24} className="text-zinc-300" />
      </div>
      <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-2">
        {tab === "all" ? "NO PRODUCTS YET" : `NO ${tab.toUpperCase()} PRODUCTS`}
      </p>
      <p className="text-sm text-zinc-500 mb-6 max-w-xs mx-auto">
        {tab === "all"
          ? "Add your first product and let AI design it to match your brand."
          : "Products in this state will appear here."}
      </p>
      {tab === "all" && (
        <Link
          href={`/dashboard/${brandId}/products/new`}
          className="inline-flex items-center gap-2 bg-zinc-900 text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-violet-600 transition-colors"
        >
          <Plus size={14} /> Create first product
        </Link>
      )}
    </div>
  );
}
