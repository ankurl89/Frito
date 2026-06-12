import { getExecutiveMetrics } from "@/lib/mission-control/metrics";
import { ORDER_STATUS_META } from "@/lib/orders/states";
import { TrendingUp, Users, ShoppingCart, Activity, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ExecutiveDashboard() {
  const m = await getExecutiveMetrics();

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-mono text-[10px] tracking-widest text-zinc-600 mb-2">/ EXECUTIVE /</p>
        <h1 className="text-3xl font-black tracking-tight">Command Center</h1>
        <p className="text-zinc-500 text-sm mt-1">Real-time platform health · all merchants</p>
      </div>

      {/* Top KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Kpi label="GMV THIS MONTH" value={`₹${m.revenue.gmvMonth.toLocaleString("en-IN")}`} icon={TrendingUp} accent="text-green-400" sub={`₹${m.revenue.gmvToday.toLocaleString("en-IN")} today`} />
        <Kpi label="NET PROFIT (MO)" value={`₹${m.revenue.profitMonth.toLocaleString("en-IN")}`} icon={TrendingUp} accent="text-violet-400" sub={`AOV ₹${m.revenue.aov.toLocaleString("en-IN")}`} />
        <Kpi label="MERCHANTS" value={m.merchants.total} icon={Users} accent="text-blue-400" sub={`${m.merchants.active} active · +${m.merchants.newMonth} this mo`} />
        <Kpi label="ORDERS TODAY" value={m.orders.today} icon={ShoppingCart} accent="text-amber-400" sub={`${m.orders.total} all-time`} />
      </div>

      {/* Operational health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="FULFILLMENT SUCCESS" value={`${m.ops.fulfillmentSuccessRate}%`} icon={Activity} accent={m.ops.fulfillmentSuccessRate >= 99 ? "text-green-400" : "text-amber-400"} />
        <Kpi label="QUEUE: WAITING" value={m.ops.queueQueued} icon={Activity} accent="text-zinc-300" />
        <Kpi label="QUEUE: RETRYING" value={m.ops.queueFailed} icon={Activity} accent={m.ops.queueFailed > 0 ? "text-amber-400" : "text-zinc-300"} />
        <Kpi label="DEAD-LETTER" value={m.ops.queueDead} icon={AlertTriangle} accent={m.ops.queueDead > 0 ? "text-red-400" : "text-green-400"} alert={m.ops.queueDead > 0} />
      </div>

      {/* Orders by state */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <p className="font-mono text-[10px] tracking-widest text-zinc-600 mb-5">ORDERS BY STATE</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(ORDER_STATUS_META).map(([state, meta]) => {
            const count = m.orders.byState[state] || 0;
            return (
              <div key={state} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <p className="text-2xl font-black">{count}</p>
                <p className="font-mono text-[9px] tracking-wider text-zinc-500 mt-1">{meta.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, accent, sub, alert }: {
  label: string; value: string | number; icon: React.ElementType; accent: string; sub?: string; alert?: boolean;
}) {
  return (
    <div className={`bg-zinc-900 border rounded-2xl p-5 ${alert ? "border-red-500/40" : "border-zinc-800"}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[9px] tracking-widest text-zinc-600">{label}</p>
        <Icon size={14} className={accent} />
      </div>
      <p className={`text-2xl font-black ${alert ? "text-red-400" : ""}`}>{value}</p>
      {sub && <p className="font-mono text-[10px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}
