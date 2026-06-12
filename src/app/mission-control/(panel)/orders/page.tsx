import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { ORDER_STATES, ORDER_STATUS_META } from "@/lib/orders/states";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

function ageOf(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.floor(ms / 60_000)}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function OrderOpsPage({
  searchParams,
}: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const svc = createServiceClient();

  let query = svc
    .from("orders")
    .select("id, status, total_amount, created_at, customer_name, customer_email, tracking_number, brands(name, slug), products(name, fulfillment_provider)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && status !== "all") query = query.eq("status", status);
  if (q) query = query.or(`customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`);

  const { data: orders } = await query;
  const list = (orders || []) as unknown as OrderRow[];

  // State counts for filter chips.
  const { data: allForCounts } = await svc.from("orders").select("status");
  const counts: Record<string, number> = {};
  for (const o of (allForCounts || []) as { status: string }[]) counts[o.status] = (counts[o.status] || 0) + 1;

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="font-mono text-[10px] tracking-widest text-zinc-600 mb-2">/ ORDER OPERATIONS /</p>
        <h1 className="text-3xl font-black tracking-tight">Orders</h1>
        <p className="text-zinc-500 text-sm mt-1">Every order across every merchant</p>
      </div>

      {/* Search */}
      <form className="mb-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search customer name or email…"
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
          />
          {status && <input type="hidden" name="status" value={status} />}
        </div>
      </form>

      {/* Filter chips */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        <FilterChip label="ALL" href="/mission-control/orders" active={!status || status === "all"} count={Object.values(counts).reduce((a, b) => a + b, 0)} />
        {ORDER_STATES.map(s => (
          <FilterChip
            key={s}
            label={ORDER_STATUS_META[s].label}
            href={`/mission-control/orders?status=${s}`}
            active={status === s}
            count={counts[s] || 0}
          />
        ))}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-zinc-800 font-mono text-[9px] tracking-widest text-zinc-600">
          <div className="col-span-2">ORDER</div>
          <div className="col-span-2">MERCHANT</div>
          <div className="col-span-2">CUSTOMER</div>
          <div className="col-span-2">PRODUCT</div>
          <div className="col-span-2">STATUS</div>
          <div className="col-span-1 text-right">AMOUNT</div>
          <div className="col-span-1 text-right">AGE</div>
        </div>
        {list.length === 0 ? (
          <div className="px-5 py-16 text-center text-zinc-600 font-mono text-xs">NO ORDERS MATCH</div>
        ) : list.map(o => {
          const meta = ORDER_STATUS_META[o.status] || { label: o.status.toUpperCase(), cls: "" };
          return (
            <Link key={o.id} href={`/mission-control/orders/${o.id}`}
              className="grid grid-cols-12 gap-3 px-5 py-3.5 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/40 transition-colors items-center text-sm">
              <div className="col-span-2 font-mono text-xs text-zinc-400">#{o.id.slice(0, 8).toUpperCase()}</div>
              <div className="col-span-2 truncate font-medium">{o.brands?.name || "—"}</div>
              <div className="col-span-2 truncate text-zinc-400">{o.customer_name}</div>
              <div className="col-span-2 truncate text-zinc-400 text-xs">{o.products?.name || "—"}</div>
              <div className="col-span-2">
                <span className={`font-mono text-[9px] tracking-wider border rounded px-1.5 py-0.5 ${meta.cls}`}>{meta.label}</span>
              </div>
              <div className="col-span-1 text-right font-bold">₹{o.total_amount?.toLocaleString("en-IN")}</div>
              <div className="col-span-1 text-right font-mono text-xs text-zinc-500">{ageOf(o.created_at)}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({ label, href, active, count }: { label: string; href: string; active: boolean; count: number }) {
  return (
    <Link href={href} className={`font-mono text-[10px] tracking-wider px-2.5 py-1.5 rounded-lg border transition-colors ${
      active ? "bg-violet-600 border-violet-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600"
    }`}>
      {label} <span className="opacity-50">{count}</span>
    </Link>
  );
}

interface OrderRow {
  id: string; status: string; total_amount: number; created_at: string;
  customer_name: string; customer_email: string; tracking_number: string | null;
  brands: { name: string; slug: string } | null;
  products: { name: string; fulfillment_provider: string } | null;
}
