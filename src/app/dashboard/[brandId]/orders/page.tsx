import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Order } from "@/lib/types";
import { ShoppingBag } from "lucide-react";

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:         { label: "PENDING",     cls: "border-zinc-300 text-zinc-500 bg-zinc-50" },
  confirmed:       { label: "CONFIRMED",   cls: "border-blue-300 text-blue-600 bg-blue-50" },
  in_production:   { label: "IN PROD",     cls: "border-blue-300 text-blue-600 bg-blue-50" },
  ready_to_ship:   { label: "READY",       cls: "border-yellow-400 text-yellow-700 bg-yellow-50" },
  shipped:         { label: "SHIPPED",     cls: "border-yellow-400 text-yellow-700 bg-yellow-50" },
  delivered:       { label: "DELIVERED",   cls: "border-green-300 text-green-700 bg-green-50" },
  cancelled:       { label: "CANCELLED",   cls: "border-red-300 text-red-600 bg-red-50" },
  refund_requested:{ label: "REFUND",      cls: "border-red-300 text-red-600 bg-red-50" },
};

export default async function OrdersPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  const o = (orders || []) as Order[];
  const totalRevenue = o.reduce((s, x) => s + (x.total_amount || 0), 0);
  const totalProfit  = o.reduce((s, x) => s + (x.profit_amount || 0), 0);

  return (
    <div className="p-8">
      <div className="mb-10">
        <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-2">/ ORDER MANAGEMENT /</p>
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Orders</h1>
        <p className="text-zinc-400 text-sm mt-1">All orders auto-fulfill through Qikink — nothing manual.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-zinc-200 rounded-2xl p-5">
          <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-2">TOTAL ORDERS</p>
          <p className="text-3xl font-black text-zinc-900">{o.length}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-5">
          <p className="font-mono text-[10px] tracking-widest text-zinc-400 mb-2">REVENUE</p>
          <p className="text-3xl font-black text-zinc-900">₹{totalRevenue.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-yellow-300 border border-yellow-400 rounded-2xl p-5">
          <p className="font-mono text-[10px] tracking-widest text-zinc-600 mb-2">NET PROFIT</p>
          <p className="text-3xl font-black text-zinc-900">₹{totalProfit.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {o.length === 0 ? (
        <div className="text-center py-24 bg-white border border-zinc-200 rounded-2xl">
          <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={22} className="text-zinc-300" />
          </div>
          <p className="font-mono text-[10px] tracking-widest text-zinc-300 mb-2">NO ORDERS YET</p>
          <p className="text-sm text-zinc-400 max-w-xs mx-auto">When customers order, they appear here and automatically route to production.</p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-50 border-b border-zinc-100">
            {["ORDER", "CUSTOMER", "STATUS", "TRACKING", "AMOUNT", "PROFIT"].map(h => (
              <div key={h} className={`font-mono text-[9px] tracking-widest text-zinc-400 ${
                h === "ORDER" ? "col-span-2" :
                h === "CUSTOMER" ? "col-span-3" :
                h === "STATUS" ? "col-span-2" :
                h === "TRACKING" ? "col-span-2" :
                "col-span-1 text-right"
              }`}>
                {h}
              </div>
            ))}
          </div>

          {o.map((order, i) => {
            const s = STATUS[order.status] || STATUS.pending;
            return (
              <div key={order.id} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-zinc-50 transition-colors ${i < o.length - 1 ? "border-b border-zinc-50" : ""}`}>
                <div className="col-span-2">
                  <p className="font-mono text-xs text-zinc-600">#{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="font-mono text-[10px] text-zinc-400">{new Date(order.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="col-span-3">
                  <p className="font-bold text-sm text-zinc-900">{order.customer_name}</p>
                  <p className="text-xs text-zinc-400 truncate">{order.customer_email}</p>
                </div>
                <div className="col-span-2">
                  <span className={`font-mono text-[9px] tracking-wider border rounded px-2 py-0.5 ${s.cls}`}>{s.label}</span>
                </div>
                <div className="col-span-2">
                  {order.tracking_number ? (
                    <div>
                      <p className="font-mono text-[10px] text-zinc-600">{order.tracking_number}</p>
                      <p className="font-mono text-[9px] text-zinc-400">{order.courier}</p>
                    </div>
                  ) : (
                    <span className="text-zinc-300 text-xs">—</span>
                  )}
                </div>
                <div className="col-span-1 text-right">
                  <p className="font-black text-sm text-zinc-900">₹{order.total_amount}</p>
                </div>
                <div className="col-span-1 text-right">
                  <p className="font-black text-sm text-green-600">₹{order.profit_amount}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
