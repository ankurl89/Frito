"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { StaffContext } from "@/lib/mission-control/auth";
import { ROLE_META, hasPermission, Permission } from "@/lib/mission-control/rbac";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ShoppingCart, Truck, Users, UserCircle,
  DollarSign, Boxes, ShieldAlert, ScrollText, Bot, ChevronLeft, LogOut,
} from "lucide-react";

const NAV: { label: string; href: string; icon: React.ElementType; perm: Permission; soon?: boolean }[] = [
  { label: "Executive",    href: "/mission-control",              icon: LayoutDashboard, perm: "view_executive" },
  { label: "Orders",       href: "/mission-control/orders",       icon: ShoppingCart,    perm: "view_orders" },
  { label: "Fulfillment",  href: "/mission-control/fulfillment",  icon: Truck,           perm: "view_fulfillment" },
  { label: "Merchants",    href: "/mission-control/merchants",    icon: Users,           perm: "view_merchants" },
  { label: "Customers",    href: "/mission-control/customers",    icon: UserCircle,      perm: "view_customers" },
  { label: "Audit",        href: "/mission-control/audit",        icon: ScrollText,      perm: "view_audit" },
  { label: "Pricing",      href: "/mission-control/pricing",      icon: DollarSign,      perm: "view_pricing", soon: true },
  { label: "Inventory",    href: "/mission-control/inventory",    icon: Boxes,           perm: "view_inventory", soon: true },
  { label: "Risk",         href: "/mission-control/risk",         icon: ShieldAlert,     perm: "view_fulfillment", soon: true },
  { label: "Copilot",      href: "/mission-control/copilot",      icon: Bot,             perm: "view_executive", soon: true },
];

export default function MissionControlNav({ staff }: { staff: StaffContext }) {
  const pathname = usePathname();
  const router = useRouter();
  const roleMeta = ROLE_META[staff.role];
  const visible = NAV.filter(n => hasPermission(staff.role, n.perm));

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/mission-control/login");
    router.refresh();
  }

  return (
    <aside className="w-60 bg-black border-r border-zinc-800 flex flex-col flex-shrink-0 h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-zinc-800">
        <p className="font-black text-lg tracking-tight">
          FRITO<span className="text-violet-500"> MC</span>
        </p>
        <p className="font-mono text-[9px] tracking-widest text-zinc-600 mt-0.5">MISSION CONTROL</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visible.map(({ label, href, icon: Icon, soon }) => {
          const active = href === "/mission-control" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={soon ? "#" : href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                active ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
                soon && "opacity-40 pointer-events-none"
              )}
            >
              <Icon size={15} />
              <span className="font-mono text-[11px] tracking-widest font-semibold">{label.toUpperCase()}</span>
              {soon && <span className="ml-auto text-[8px] font-mono text-zinc-600">SOON</span>}
            </Link>
          );
        })}
      </nav>

      {/* Staff identity */}
      <div className="px-3 py-4 border-t border-zinc-800 space-y-2">
        <div className="px-2">
          <p className="text-sm font-bold truncate">{staff.displayName || staff.email}</p>
          <span className={cn("inline-block mt-1 font-mono text-[9px] tracking-wider border rounded px-1.5 py-0.5", roleMeta.cls)}>
            {roleMeta.label.toUpperCase()}
          </span>
        </div>
        <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition-colors">
          <ChevronLeft size={13} />
          <span className="font-mono text-[10px] tracking-widest">EXIT TO APP</span>
        </Link>
        <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-500 hover:bg-red-950/40 hover:text-red-300 transition-colors">
          <LogOut size={13} />
          <span className="font-mono text-[10px] tracking-widest">SIGN OUT</span>
        </button>
      </div>
    </aside>
  );
}
