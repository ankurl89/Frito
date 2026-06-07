import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BrandDNA, Order, Product } from "@/lib/types";
import { Package, ShoppingBag, TrendingUp, ArrowRight, Plus } from "lucide-react";

export default async function BrandOverviewPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: brand }, { data: products }, { data: orders }] = await Promise.all([
    supabase.from("brands").select("*").eq("id", brandId).single(),
    supabase.from("products").select("*").eq("brand_id", brandId).eq("status", "active"),
    supabase.from("orders").select("*").eq("brand_id", brandId).order("created_at", { ascending: false }).limit(5),
  ]);

  if (!brand) redirect("/dashboard");

  const b = brand as BrandDNA;
  const palette = b.palette as Record<string, string> | undefined;
  const totalRevenue = (orders || []).reduce((sum: number, o: Order) => sum + (o.total_amount || 0), 0);
  const totalProfit = (orders || []).reduce((sum: number, o: Order) => sum + (o.profit_amount || 0), 0);

  return (
    <div className="p-8">
      {/* Brand header */}
      <div className="mb-10">
        <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-3">/ BRAND OVERVIEW /</p>
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-sm flex-shrink-0"
            style={{ backgroundColor: palette?.primary || "#7c3aed" }}
          >
            {b.logo_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={b.logo_url} alt={b.name} className="w-full h-full object-contain rounded-xl" />
              : b.name?.[0]}
          </div>
          <div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">{b.name}</h1>
            <p className="text-zinc-400 italic mt-0.5">"{b.tagline}"</p>
          </div>
        </div>

        {/* Palette + badges */}
        <div className="flex items-center gap-3">
          {palette && Object.values(palette).slice(0, 5).map((color, i) => (
            <div key={i} className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color as string }} />
          ))}
          <span className="font-mono text-[9px] tracking-wider border border-zinc-300 text-zinc-500 px-2 py-0.5 rounded uppercase ml-1">{b.niche}</span>
          <span className="font-mono text-[9px] tracking-wider border border-zinc-300 text-zinc-500 px-2 py-0.5 rounded uppercase">{b.price_tier}</span>
          <span className="font-mono text-[9px] tracking-wider bg-green-100 border border-green-200 text-green-700 px-2 py-0.5 rounded uppercase">LIVE</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "TOTAL REVENUE", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
          { label: "PRODUCTS LIVE", value: (products || []).length, icon: Package, color: "text-violet-500", bg: "bg-violet-50" },
          { label: "TOTAL ORDERS", value: (orders || []).length, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50" },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-zinc-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[10px] tracking-widest text-zinc-400">{stat.label}</p>
              <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon size={14} className={stat.color} />
              </div>
            </div>
            <p className="text-3xl font-black text-zinc-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Brand Identity */}
        <div className="bg-zinc-900 rounded-2xl p-6 text-white">
          <p className="font-mono text-[10px] tracking-widest text-zinc-500 mb-4">BRAND IDENTITY</p>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-mono text-[9px] tracking-widest text-zinc-500 mb-1">STORY</p>
              <p className="text-zinc-300 leading-relaxed">{b.story}</p>
            </div>
            <div>
              <p className="font-mono text-[9px] tracking-widest text-zinc-500 mb-1">AUDIENCE</p>
              <p className="text-zinc-300">{b.target_audience}</p>
            </div>
            <div>
              <p className="font-mono text-[9px] tracking-widest text-zinc-500 mb-1">VOICE</p>
              <p className="text-zinc-300">{b.voice_tone}</p>
            </div>
            <div>
              <p className="font-mono text-[9px] tracking-widest text-zinc-500 mb-2">VALUES</p>
              <div className="flex flex-wrap gap-1.5">
                {(b.brand_values || []).map((v: string, i: number) => (
                  <span key={i} className="font-mono text-[9px] tracking-wider border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded">{v}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Quick actions */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-4">QUICK ACTIONS</p>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/dashboard/${brandId}/products/new`}
                className="flex items-center gap-2 px-4 py-3 bg-zinc-900 text-white font-bold text-sm rounded-xl hover:bg-violet-600 transition-colors"
              >
                <Plus size={14} /> Add Product
              </Link>
              <Link
                href={`/dashboard/${brandId}/orders`}
                className="flex items-center gap-2 px-4 py-3 border-2 border-zinc-900 text-zinc-900 font-bold text-sm rounded-xl hover:bg-zinc-50 transition-colors"
              >
                <ShoppingBag size={14} /> View Orders
              </Link>
            </div>
          </div>

          {/* Recent orders */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[10px] tracking-widest text-zinc-400">RECENT ORDERS</p>
              <Link href={`/dashboard/${brandId}/orders`} className="text-xs text-violet-600 font-semibold flex items-center gap-1 hover:underline">
                All orders <ArrowRight size={11} />
              </Link>
            </div>
            {!orders || orders.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-zinc-100 rounded-xl">
                <ShoppingBag size={24} className="text-zinc-200 mx-auto mb-2" />
                <p className="font-mono text-[10px] tracking-widest text-zinc-300">NO ORDERS YET</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(orders as Order[]).map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0">
                    <div>
                      <p className="font-bold text-sm text-zinc-900">{order.customer_name}</p>
                      <p className="font-mono text-[10px] text-zinc-400 tracking-wider">{new Date(order.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm text-zinc-900">₹{order.total_amount}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profit summary */}
          {(orders || []).length > 0 && (
            <div className="bg-yellow-300 border border-yellow-400 rounded-2xl p-6">
              <p className="font-mono text-[10px] tracking-widest text-zinc-600 mb-3">PROFIT SUMMARY</p>
              <div className="flex items-end gap-8">
                <div>
                  <p className="text-4xl font-black text-zinc-900">₹{totalProfit.toLocaleString("en-IN")}</p>
                  <p className="text-zinc-600 text-sm font-medium mt-1">net profit earned</p>
                </div>
                <div>
                  <p className="text-xl font-black text-zinc-700">₹{totalRevenue.toLocaleString("en-IN")}</p>
                  <p className="text-zinc-500 text-xs font-medium mt-1">gross revenue</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "PENDING", cls: "border-zinc-300 text-zinc-500" },
    confirmed: { label: "CONFIRMED", cls: "border-blue-300 text-blue-600" },
    in_production: { label: "IN PROD", cls: "border-blue-300 text-blue-600" },
    ready_to_ship: { label: "READY", cls: "border-yellow-400 text-yellow-700" },
    shipped: { label: "SHIPPED", cls: "border-yellow-400 text-yellow-700" },
    delivered: { label: "DELIVERED", cls: "border-green-300 text-green-600" },
    cancelled: { label: "CANCELLED", cls: "border-red-300 text-red-500" },
  };
  const s = map[status] || { label: status.toUpperCase(), cls: "border-zinc-300 text-zinc-400" };
  return (
    <span className={`font-mono text-[9px] tracking-wider border rounded px-1.5 py-0.5 ${s.cls}`}>{s.label}</span>
  );
}
