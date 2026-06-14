import Link from "next/link";
import { notFound } from "next/navigation";
import { getStaff } from "@/lib/mission-control/auth";
import { hasPermission } from "@/lib/mission-control/rbac";
import { getMerchantDetail } from "@/lib/mission-control/admin-data";
import { ORDER_STATUS_META } from "@/lib/orders/states";
import { subdomainUrl } from "@/lib/domains";
import { ArrowLeft, ExternalLink, TrendingUp, ShoppingCart, Boxes, Wallet } from "lucide-react";
import MerchantActions from "@/components/mission-control/MerchantActions";

export const dynamic = "force-dynamic";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  live:      { label: "Live",      cls: "bg-green-500/15 text-green-300 border-green-500/30" },
  draft:     { label: "Draft",     cls: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
  suspended: { label: "Suspended", cls: "bg-red-500/15 text-red-300 border-red-500/30" },
};

export default async function MerchantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getStaff();
  if (!staff || !hasPermission(staff.role, "view_merchants")) notFound();

  const detail = await getMerchantDetail(id);
  if (!detail) notFound();

  const brand = detail.brand as Record<string, string>;
  const displayStatus = brand.status === "suspended" ? "suspended" : detail.totals.liveProducts > 0 ? "live" : "draft";
  const meta = STATUS_META[displayStatus] || STATUS_META.draft;
  const storeUrl = brand.slug ? (subdomainUrl(brand.slug) || `/store/${brand.slug}`) : null;

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/mission-control/merchants" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-6">
        <ArrowLeft size={14} /> Back to merchants
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tracking-tight">{brand.name}</h1>
            <span className={`font-mono text-[10px] tracking-wider border rounded px-2 py-0.5 ${meta.cls}`}>{meta.label}</span>
          </div>
          <p className="text-zinc-500 text-sm">
            {detail.ownerEmail || "—"} · joined {new Date(brand.created_at).toLocaleDateString("en-IN")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {storeUrl && (
            <a href={storeUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-xs font-bold hover:bg-zinc-800 transition-colors">
              <ExternalLink size={12} /> Open store
            </a>
          )}
          <MerchantActions
            brandId={brand.id}
            status={brand.status}
            canSuspend={hasPermission(staff.role, "suspend_merchant")}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="REVENUE" value={`₹${detail.totals.revenue.toLocaleString("en-IN")}`} icon={TrendingUp} accent="text-green-400" />
        <Kpi label="NET PROFIT" value={`₹${detail.totals.profit.toLocaleString("en-IN")}`} icon={Wallet} accent="text-violet-400" />
        <Kpi label="ORDERS" value={detail.totals.orders} icon={ShoppingCart} accent="text-amber-400" />
        <Kpi label="LIVE PRODUCTS" value={detail.totals.liveProducts} icon={Boxes} accent="text-blue-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Brand meta */}
        <Panel title="BRAND">
          <div className="space-y-2 text-xs">
            <Row k="Niche" v={brand.niche || "—"} />
            <Row k="Price tier" v={brand.price_tier || "—"} />
            <Row k="Tagline" v={brand.tagline || "—"} />
            <Row k="Slug" v={brand.slug ? `/${brand.slug}` : "—"} mono />
            <Row k="Brand Book" v={brand.brand_book_status || "—"} />
            <Row k="Brand ID" v={brand.id} mono />
          </div>
        </Panel>

        {/* Products */}
        <Panel title={`PRODUCTS · ${detail.products.length}`}>
          {detail.products.length === 0 ? (
            <p className="text-zinc-600 font-mono text-xs">No products</p>
          ) : (
            <div className="space-y-2">
              {detail.products.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs">
                  <span className="text-zinc-300 truncate">{p.name}</span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {p.base_price != null && <span className="text-zinc-500">₹{p.base_price.toLocaleString("en-IN")}</span>}
                    <span className="font-mono text-[9px] tracking-wider text-zinc-600">{(p.status || "").toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Recent orders */}
      <div className="mt-5">
        <Panel title="RECENT ORDERS">
          {detail.recentOrders.length === 0 ? (
            <p className="text-zinc-600 font-mono text-xs">No orders yet</p>
          ) : (
            <div className="space-y-1.5">
              {detail.recentOrders.map(o => {
                const om = ORDER_STATUS_META[o.status] || { label: o.status, cls: "" };
                return (
                  <Link key={o.id} href={`/mission-control/orders/${o.id}`}
                    className="grid grid-cols-12 gap-3 items-center bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs hover:bg-zinc-800/40 transition-colors">
                    <span className="col-span-2 font-mono text-zinc-400">#{o.id.slice(0, 8).toUpperCase()}</span>
                    <span className="col-span-3 truncate text-zinc-300">{o.customer_name}</span>
                    <span className="col-span-3 truncate text-zinc-500">{o.product_name || "—"}</span>
                    <span className="col-span-2"><span className={`font-mono text-[9px] tracking-wider border rounded px-1.5 py-0.5 ${om.cls}`}>{om.label}</span></span>
                    <span className="col-span-2 text-right font-bold">₹{o.total_amount?.toLocaleString("en-IN")}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[9px] tracking-widest text-zinc-600">{label}</p>
        <Icon size={14} className={accent} />
      </div>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="font-mono text-[10px] tracking-widest text-zinc-600 mb-4">{title}</p>
      {children}
    </div>
  );
}
function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-zinc-600">{k}</span>
      <span className={`${mono ? "font-mono" : ""} text-zinc-300 text-right truncate`}>{v}</span>
    </div>
  );
}
