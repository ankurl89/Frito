import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Product } from "@/lib/types";
import StorefrontProductCard from "@/components/storefront/StorefrontProductCard";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string; category: string }> }) {
  const { slug, category } = await params;
  const supabase = await createClient();

  const { data: brand } = await supabase.from("brands").select("*").eq("slug", slug).single();
  if (!brand) notFound();

  let query = supabase
    .from("products")
    .select("*")
    .eq("brand_id", brand.id)
    .in("status", ["published", "active"]);

  // "all" → no category filter
  const decoded = decodeURIComponent(category).replace(/-/g, " ").toLowerCase();
  if (decoded !== "all") {
    query = query.ilike("category", decoded);
  }

  const { data: products } = await query.order("created_at", { ascending: false });
  const list = (products || []) as Product[];

  const heading = decoded === "all" ? "Shop All" : decoded.replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div style={{ backgroundColor: "var(--brand-bg)", color: "var(--brand-text)" }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="font-mono text-[11px] tracking-widest opacity-60 mb-2">COLLECTION</p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight" style={{ fontFamily: "var(--brand-headline-font)" }}>{heading}</h1>
          <p className="mt-2 opacity-60 text-sm">{list.length} {list.length === 1 ? "product" : "products"}</p>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-24 opacity-60">
            <p className="font-mono text-[10px] tracking-widest mb-2">NOTHING HERE YET</p>
            <p className="text-sm">Check back soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {list.map(p => <StorefrontProductCard key={p.id} product={p} slug={slug} />)}
          </div>
        )}
      </div>
    </div>
  );
}
