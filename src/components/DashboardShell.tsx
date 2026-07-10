"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandDNA } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Package, ShoppingBag, BarChart2, BookOpen, Plus, LogOut, ChevronDown, Radar, Store, Palette, GraduationCap, Landmark, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import DevWorkerTicker from "@/components/DevWorkerTicker";

interface Props {
  brand: BrandDNA;
  allBrands: BrandDNA[];
  children: React.ReactNode;
  isStaff?: boolean;
}

const navItems = (brandId: string) => [
  { label: "OVERVIEW", href: `/dashboard/${brandId}`, icon: LayoutDashboard },
  { label: "BRAND BOOK", href: `/dashboard/${brandId}/brand`, icon: BookOpen },
  { label: "PRODUCTS", href: `/dashboard/${brandId}/products`, icon: Package },
  { label: "CUSTOMIZE", href: `/dashboard/${brandId}/settings`, icon: Palette },
  { label: "ORDERS", href: `/dashboard/${brandId}/orders`, icon: ShoppingBag },
  { label: "ANALYTICS", href: `/dashboard/${brandId}/analytics`, icon: BarChart2 },
  { label: "PAYOUTS", href: `/dashboard/${brandId}/payouts`, icon: Landmark },
  { label: "PLAYBOOK", href: `/dashboard/${brandId}/guides`, icon: GraduationCap },
];

export default function DashboardShell({ brand, allBrands, children, isStaff }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const palette = brand.palette as Record<string, string> | undefined;
  const primaryColor = palette?.primary || "#7c3aed";
  const slug = (brand as { slug?: string }).slug;

  return (
    <div className="flex h-screen bg-[#F5F5F0] overflow-hidden">
      <DevWorkerTicker />

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-zinc-900 flex items-center justify-between px-4">
        <Link href="/" className="font-black text-white tracking-tight text-lg">
          FRITO<span className="text-violet-500">.</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="w-10 h-10 -mr-2 flex items-center justify-center text-zinc-300 hover:text-white"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          aria-hidden="true"
        />
      )}

      {/* Sidebar — dark. Static on desktop, slide-in drawer on mobile. */}
      <aside className={cn(
        "w-56 bg-zinc-900 flex flex-col flex-shrink-0 z-50",
        "fixed inset-y-0 left-0 transition-transform duration-300 md:static md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Close button (mobile only) */}
        <button
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
          className="md:hidden absolute top-4 right-3 w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white"
        >
          <X size={18} />
        </button>
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-zinc-800">
          <Link href="/" className="font-black text-white tracking-tight text-xl">
            FRITO<span className="text-violet-500">.</span>
          </Link>
        </div>

        {/* Brand switcher */}
        <div className="px-3 py-3 border-b border-zinc-800">
          <button
            onClick={() => setBrandMenuOpen(!brandMenuOpen)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors text-left"
          >
            <div
              className="w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center text-white text-xs font-black"
              style={{ backgroundColor: primaryColor }}
            >
              {brand.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{brand.name}</p>
              <p className="text-[10px] font-mono text-zinc-500 truncate tracking-wider uppercase">{brand.niche}</p>
            </div>
            <ChevronDown size={13} className="text-zinc-500 flex-shrink-0" />
          </button>

          {brandMenuOpen && (
            <div className="mt-1 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden shadow-xl">
              {allBrands.map((b) => (
                <Link
                  key={b.id}
                  href={`/dashboard/${b.id}`}
                  onClick={() => setBrandMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-zinc-700 transition-colors"
                >
                  <div
                    className="w-5 h-5 rounded flex-shrink-0 text-white text-[10px] font-black flex items-center justify-center"
                    style={{ backgroundColor: (b.palette as Record<string, string>)?.primary || "#7c3aed" }}
                  >
                    {b.name?.[0]}
                  </div>
                  <span className="truncate text-zinc-300 text-sm font-medium">{b.name}</span>
                </Link>
              ))}
              <Link
                href="/onboarding"
                onClick={() => setBrandMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-violet-400 hover:bg-zinc-700 transition-colors border-t border-zinc-700 font-medium"
              >
                <Plus size={13} />
                New brand
              </Link>
            </div>
          )}
        </div>

        {/* Live store — always one click away */}
        {slug && (
          <div className="px-3 pt-3">
            <a
              href={`/store/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white text-zinc-900 font-bold text-sm hover:bg-violet-50 transition-colors"
            >
              <Store size={14} />
              View Live Store
            </a>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems(brand.id).map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  active
                    ? "bg-violet-600 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                )}
              >
                <Icon size={14} />
                <span className="font-mono text-[11px] tracking-widest font-semibold">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-zinc-800 space-y-0.5">
          {isStaff && (
            <Link
              href="/mission-control"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-violet-300 hover:bg-violet-600/20 transition-colors"
            >
              <Radar size={14} />
              <span className="font-mono text-[11px] tracking-widest">MISSION CONTROL</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <LogOut size={14} />
            <span className="font-mono text-[11px] tracking-widest">SIGN OUT</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
