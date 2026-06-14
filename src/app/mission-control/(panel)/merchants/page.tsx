import Link from "next/link";
import { notFound } from "next/navigation";
import { getStaff } from "@/lib/mission-control/auth";
import { hasPermission } from "@/lib/mission-control/rbac";
import { listMerchants } from "@/lib/mission-control/admin-data";
import { Search, Store } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  live:      { label: "Live",      cls: "bg-green-500/15 text-green-300 border-green-500/30" },
  draft:     { label: "Draft",     cls: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
  suspended: { label: "Suspended", cls: "bg-red-500/15 text-red-300 border-red-500/30" },
};

function ageOf(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.floor(ms / 60_000)}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function MerchantsPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const staff = await getStaff();
  if (!staff || !hasPermission(staff.role, "view_merchants")) notFound();

  const { q, status } = await searchParams;
  let merchants = await listMerchants();

  const counts = {
    all: merchants.length,
    live: merchants.filter(m => m.displayStatus === "live").length,
    draft: merchants.filter(m => m.displayStatus === "draft").length,
    suspended: merchants.filter(m => m.displayStatus === "suspended").length,
  };

  if (status && status !== "all") merchants = merchants.filter(m => m.displayStatus === status);
  if (q) {
    const needle = q.toLowerCase();
    merchants = merchants.filter(m =>
      m.name.toLowerCase().includes(needle) ||
      (m.slug || "").toLowerCase().includes(needle) ||
      (m.ownerEmail || "").toLowerCase().includes(needle)
    );
  }

  const totalRevenue = merchants.reduce((s, m) => s + m.revenue, 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="font-mono text-[10px] tracking-widest text-zinc-600 mb-2">/ MERCHANTS /</p>
        <h1 className="text-3xl font-black tracking-tight">Merchants</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Every brand on the platform · ₹{totalRevenue.toLocaleString("en-IN")} tracked revenue
        </p>
      </div>

      {/* Search */}
      <form className="mb-4">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search brand, slug, or owner email…"
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
          />
          {status && <input type="hidden" name="status" value={status} />}
        </div>
      </form>

      {/* Filter chips */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        <FilterChip label="ALL" href="/mission-control/merchants" active={!status || status === "all"} count={counts.all} />
        <FilterChip label="LIVE" href="/mission-control/merchants?status=live" active={status === "live"} count={counts.live} />
        <FilterChip label="DRAFT" href="/mission-control/merchants?status=draft" active={status === "draft"} count={counts.draft} />
        <FilterChip label="SUSPENDED" href="/mission-control/merchants?status=suspended" active={status === "suspended"} count={counts.suspended} />
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-zinc-800 font-mono text-[9px] tracking-widest text-zinc-600">
          <div className="col-span-3">MERCHANT</div>
          <div className="col-span-3">OWNER</div>
          <div className="col-span-1">STATUS</div>
          <div className="col-span-1 text-right">PRODUCTS</div>
          <div className="col-span-1 text-right">ORDERS</div>
          <div className="col-span-2 text-right">REVENUE</div>
          <div className="col-span-1 text-right">LAST</div>
        </div>
        {merchants.length === 0 ? (
          <div className="px-5 py-16 text-center text-zinc-600 font-mono text-xs">NO MERCHANTS MATCH</div>
        ) : merchants.map(m => {
          const meta = STATUS_META[m.displayStatus] || STATUS_META.draft;
          return (
            <Link key={m.id} href={`/mission-control/merchants/${m.id}`}
              className="grid grid-cols-12 gap-3 px-5 py-3.5 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/40 transition-colors items-center text-sm">
              <div className="col-span-3 min-w-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <Store size={13} className="text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{m.name}</p>
                    <p className="font-mono text-[10px] text-zinc-600 truncate">{m.slug ? `/${m.slug}` : "no slug"}</p>
                  </div>
                </div>
              </div>
              <div className="col-span-3 truncate text-zinc-400 text-xs">{m.ownerEmail || "—"}</div>
              <div className="col-span-1">
                <span className={`font-mono text-[9px] tracking-wider border rounded px-1.5 py-0.5 ${meta.cls}`}>{meta.label}</span>
              </div>
              <div className="col-span-1 text-right text-zinc-300">{m.liveProducts}</div>
              <div className="col-span-1 text-right text-zinc-300">{m.orders}</div>
              <div className="col-span-2 text-right font-bold">₹{m.revenue.toLocaleString("en-IN")}</div>
              <div className="col-span-1 text-right font-mono text-xs text-zinc-500">{ageOf(m.lastOrderAt)}</div>
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
