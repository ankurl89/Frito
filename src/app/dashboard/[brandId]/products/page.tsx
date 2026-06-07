import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Product } from "@/lib/types";
import { Plus, ImageOff } from "lucide-react";

export default async function ProductsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-10">
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

      {!products || products.length === 0 ? (
        <div className="text-center py-24 bg-white border border-zinc-200 rounded-2xl">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ImageOff size={24} className="text-zinc-300" />
          </div>
          <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-2">NO PRODUCTS YET</p>
          <p className="text-zinc-500 text-sm mb-6 max-w-xs mx-auto">Add your first product and let AI design it to match your brand perfectly.</p>
          <Link
            href={`/dashboard/${brandId}/products/new`}
            className="inline-flex items-center gap-2 bg-zinc-900 text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-violet-600 transition-colors"
          >
            <Plus size={14} /> Create first product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(products as Product[]).map((product) => (
            <div key={product.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-zinc-300 transition-all">
              {/* Design preview */}
              <div className="aspect-square bg-zinc-50 flex items-center justify-center p-6 relative">
                {product.design_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.design_url} alt={product.name} className="w-full h-full object-contain" />
                ) : (
                  <ImageOff size={28} className="text-zinc-200" />
                )}
                <div className="absolute top-3 right-3">
                  <span className={`font-mono text-[9px] tracking-wider border rounded px-2 py-0.5 ${
                    product.status === "active"
                      ? "border-green-300 bg-green-50 text-green-700"
                      : "border-zinc-300 bg-zinc-50 text-zinc-500"
                  }`}>
                    {product.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <p className="font-mono text-[9px] tracking-widest text-zinc-400 mb-1">{product.category} · {product.sku}</p>
                <h3 className="font-black text-zinc-900 mb-3">{product.name}</h3>

                {/* Cost / Sell / Profit */}
                <div className="grid grid-cols-3 gap-2">
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
          ))}
        </div>
      )}
    </div>
  );
}
