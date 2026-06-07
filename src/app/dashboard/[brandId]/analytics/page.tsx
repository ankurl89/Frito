import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Order, Product } from "@/lib/types";

export default async function AnalyticsPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase.from("orders").select("*").eq("brand_id", brandId),
    supabase.from("products").select("*").eq("brand_id", brandId),
  ]);

  const o = (orders || []) as Order[];
  const p = (products || []) as Product[];

  const totalRevenue = o.reduce((s, x) => s + (x.total_amount || 0), 0);
  const totalProfit  = o.reduce((s, x) => s + (x.profit_amount || 0), 0);
  const totalCost    = totalRevenue - totalProfit;
  const margin       = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  const byStatus = o.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8">
      <div className="mb-10">
        <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-2">/ ANALYTICS /</p>
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Performance</h1>
      </div>

      {/* Key numbers — like the Klar "4,225 brands" counter style */}
      <div className="bg-zinc-900 rounded-2xl p-8 mb-6">
        <p className="font-mono text-[10px] tracking-widest text-zinc-500 mb-6">· LIVE · YOUR NUMBERS</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "REVENUE", value: `₹${totalRevenue.toLocaleString("en-IN")}`, sub: "gross" },
            { label: "PROFIT", value: `₹${totalProfit.toLocaleString("en-IN")}`, sub: "net", highlight: true },
            { label: "ORDERS", value: o.length, sub: "total" },
            { label: "MARGIN", value: `${margin}%`, sub: "avg" },
          ].map(m => (
            <div key={m.label}>
              <p className="font-mono text-[10px] tracking-widest text-zinc-500 mb-1">{m.label}</p>
              <p className={`text-4xl font-black ${m.highlight ? "text-yellow-300" : "text-white"}`}>{m.value}</p>
              <p className="font-mono text-[10px] text-zinc-600 mt-1">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Order status breakdown */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-5">ORDER BREAKDOWN</p>
          {Object.keys(byStatus).length === 0 ? (
            <p className="text-zinc-300 font-mono text-xs text-center py-8">NO ORDERS YET</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byStatus).map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-[10px] tracking-wider text-zinc-600 uppercase">{status.replace("_", " ")}</span>
                    <span className="font-black text-sm text-zinc-900">{count}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 bg-violet-500 rounded-full"
                      style={{ width: `${o.length > 0 ? (count / o.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Products */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6">
          <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-5">PRODUCTS</p>
          {p.length === 0 ? (
            <p className="text-zinc-300 font-mono text-xs text-center py-8">NO PRODUCTS YET</p>
          ) : (
            <div className="space-y-3">
              {p.slice(0, 6).map(product => (
                <div key={product.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                  <div>
                    <p className="font-bold text-sm text-zinc-900">{product.name}</p>
                    <p className="font-mono text-[9px] text-zinc-400 tracking-wider">{product.category}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-right">
                    <div className="bg-zinc-50 rounded-lg px-2 py-1">
                      <p className="font-mono text-[8px] text-zinc-400">SELL</p>
                      <p className="font-black text-xs text-zinc-900">₹{product.sell_price}</p>
                    </div>
                    <div className="bg-zinc-900 rounded-lg px-2 py-1">
                      <p className="font-mono text-[8px] text-zinc-400">MARGIN</p>
                      <p className="font-black text-xs text-white">₹{(product.sell_price - product.base_cost).toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profit bar — full width */}
        {totalRevenue > 0 && (
          <div className="md:col-span-2 bg-yellow-300 border border-yellow-400 rounded-2xl p-6">
            <p className="font-mono text-[10px] tracking-widest text-zinc-600 mb-5">REVENUE SPLIT</p>
            <div className="grid grid-cols-3 gap-6 text-center mb-5">
              <div>
                <p className="text-3xl font-black text-zinc-900">₹{totalRevenue.toLocaleString("en-IN")}</p>
                <p className="font-mono text-[10px] text-zinc-600 mt-1">GROSS REVENUE</p>
              </div>
              <div>
                <p className="text-3xl font-black text-zinc-600">₹{totalCost.toLocaleString("en-IN")}</p>
                <p className="font-mono text-[10px] text-zinc-500 mt-1">PRODUCTION COSTS</p>
              </div>
              <div>
                <p className="text-3xl font-black text-zinc-900">₹{totalProfit.toLocaleString("en-IN")}</p>
                <p className="font-mono text-[10px] text-zinc-600 mt-1">YOUR PROFIT</p>
              </div>
            </div>
            <div className="h-3 bg-yellow-200 rounded-full overflow-hidden flex">
              <div className="bg-red-400 h-full" style={{ width: `${(totalCost / totalRevenue) * 100}%` }} />
              <div className="bg-zinc-900 h-full" style={{ width: `${(totalProfit / totalRevenue) * 100}%` }} />
            </div>
            <div className="flex gap-5 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="font-mono text-[10px] text-zinc-600">COSTS ({Math.round((totalCost / totalRevenue) * 100)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
                <span className="font-mono text-[10px] text-zinc-600">PROFIT ({margin}%)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
