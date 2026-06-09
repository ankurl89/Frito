"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BrandDNA } from "@/lib/types";
import { ShoppingBag, Search, Menu } from "lucide-react";
import { useCart, useCartHydrated } from "@/lib/cart-store";

export default function StorefrontHeader({ brand }: { brand: BrandDNA }) {
  const { slug } = useParams<{ slug: string }>();
  const hydrated = useCartHydrated();
  const rawCount = useCart(s => s.items.filter(i => i.brand_slug === slug).reduce((sum, i) => sum + i.quantity, 0));
  const cartCount = hydrated ? rawCount : 0;

  return (
    <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: "var(--brand-bg)", borderColor: "color-mix(in srgb, var(--brand-text) 10%, transparent)" }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href={`/store/${slug}`} className="flex items-center gap-2">
            {brand.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo_url} alt={brand.name} className="w-9 h-9 rounded-lg object-contain" />
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black" style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-fg)" }}>
                {brand.name?.[0]}
              </div>
            )}
            <span className="font-black tracking-tight text-xl" style={{ color: "var(--brand-text)", fontFamily: "var(--brand-headline-font)" }}>
              {brand.name}
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
            <Link href={`/store/${slug}`} className="hover:opacity-70 transition-opacity">Home</Link>
            <Link href={`/store/${slug}/collection/all`} className="hover:opacity-70 transition-opacity">Shop All</Link>
            <Link href={`/store/${slug}#story`} className="hover:opacity-70 transition-opacity">Story</Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity" style={{ color: "var(--brand-text)" }}>
            <Search size={17} />
          </button>
          <Link href={`/store/${slug}/cart`} className="relative w-10 h-10 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity" style={{ color: "var(--brand-text)" }}>
            <ShoppingBag size={17} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center" style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-fg)" }}>
                {cartCount}
              </span>
            )}
          </Link>
          <button className="md:hidden w-10 h-10 rounded-full flex items-center justify-center" style={{ color: "var(--brand-text)" }}>
            <Menu size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
