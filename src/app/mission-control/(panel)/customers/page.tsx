import { notFound } from "next/navigation";
import { getStaff } from "@/lib/mission-control/auth";
import { hasPermission } from "@/lib/mission-control/rbac";
import { listCustomers } from "@/lib/mission-control/admin-data";
import { Search, UserCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function ageOf(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.floor(ms / 60_000)}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function CustomersPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const staff = await getStaff();
  if (!staff || !hasPermission(staff.role, "view_customers")) notFound();

  const { q } = await searchParams;
  let customers = await listCustomers();

  const totalCustomers = customers.length;
  const repeat = customers.filter(c => c.orders > 1).length;
  const totalSpend = customers.reduce((s, c) => s + c.spend, 0);

  if (q) {
    const needle = q.toLowerCase();
    customers = customers.filter(c => c.email.includes(needle) || c.name.toLowerCase().includes(needle));
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="font-mono text-[10px] tracking-widest text-zinc-600 mb-2">/ CUSTOMERS /</p>
        <h1 className="text-3xl font-black tracking-tight">Customers</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {totalCustomers} buyers across all stores · {repeat} repeat · ₹{totalSpend.toLocaleString("en-IN")} lifetime spend
        </p>
      </div>

      {/* Search */}
      <form className="mb-6">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name or email…"
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
          />
        </div>
      </form>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-zinc-800 font-mono text-[9px] tracking-widest text-zinc-600">
          <div className="col-span-5">CUSTOMER</div>
          <div className="col-span-2 text-right">ORDERS</div>
          <div className="col-span-2 text-right">BRANDS</div>
          <div className="col-span-2 text-right">SPEND</div>
          <div className="col-span-1 text-right">LAST</div>
        </div>
        {customers.length === 0 ? (
          <div className="px-5 py-16 text-center text-zinc-600 font-mono text-xs">NO CUSTOMERS MATCH</div>
        ) : customers.map(c => (
          <div key={c.email} className="grid grid-cols-12 gap-3 px-5 py-3.5 border-b border-zinc-800/50 last:border-0 items-center text-sm">
            <div className="col-span-5 min-w-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <UserCircle size={14} className="text-zinc-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold truncate">{c.name}</p>
                  <p className="font-mono text-[10px] text-zinc-600 truncate">{c.email}</p>
                </div>
              </div>
            </div>
            <div className="col-span-2 text-right text-zinc-300">
              {c.orders}
              {c.orders > 1 && <span className="ml-1.5 font-mono text-[9px] text-green-400">REPEAT</span>}
            </div>
            <div className="col-span-2 text-right text-zinc-300">{c.brands}</div>
            <div className="col-span-2 text-right font-bold">₹{c.spend.toLocaleString("en-IN")}</div>
            <div className="col-span-1 text-right font-mono text-xs text-zinc-500">{ageOf(c.lastOrderAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
