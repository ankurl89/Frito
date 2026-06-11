"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandDNA } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Package, ShoppingBag, BarChart2, BookOpen, Plus, LogOut, ChevronDown, Radar, Store } from "lucide-react";
import { useState } from "react";
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
  { label: "ORDERS", href: `/dashboard/${brandId}/orders`, icon: ShoppingBag },
  { label: "ANALYTICS", href: `/dashboard/${brandId}/analytics`, icon: BarChart2 },
];

export default function DashboardShell({ brand, allBrands, children, isStaff }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);

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
      {/* Sidebar — dark */}
      <aside className="w-56 bg-zinc-900 flex flex-col flex-shrink-0">
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
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
