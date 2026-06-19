"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { BrandDNA } from "@/lib/types";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCart, useCartHydrated } from "@/lib/cart-store";

export default function StorefrontHeader({ brand }: { brand: BrandDNA }) {
  const { slug } = useParams<{ slug: string }>();
  const pathname = usePathname();
  const hydrated = useCartHydrated();
  const rawCount = useCart(s => s.items.filter(i => i.brand_slug === slug).reduce((sum, i) => sum + i.quantity, 0));
  const cartCount = hydrated ? rawCount : 0;

  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const navLinks = [
    { label: "Home", href: `/store/${slug}` },
    { label: "Shop All", href: `/store/${slug}/collection/all` },
    { label: "Story", href: `/store/${slug}#story` },
  ];

  return (
    <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: "var(--brand-bg)", borderColor: "color-mix(in srgb, var(--brand-text) 10%, transparent)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-8 min-w-0">
          <Link href={`/store/${slug}`} className="flex items-center gap-2 min-w-0">
            {brand.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo_url} alt={brand.name} className="w-9 h-9 rounded-lg object-contain flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black flex-shrink-0" style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-fg)" }}>
                {brand.name?.[0]}
              </div>
            )}
            <span className="font-black tracking-tight text-lg sm:text-xl truncate" style={{ color: "var(--brand-text)", fontFamily: "var(--brand-headline-font)" }}>
              {brand.name}
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
            <Link href={`/store/${slug}`} className="hover:opacity-70 transition-opacity">Home</Link>
            <Link href={`/store/${slug}/collection/all`} className="hover:opacity-70 transition-opacity">Shop All</Link>
            <Link href={`/store/${slug}#story`} className="hover:opacity-70 transition-opacity">Story</Link>
          </nav>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Link href={`/store/${slug}/cart`} aria-label={`Cart, ${cartCount} items`} className="relative w-10 h-10 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity" style={{ color: "var(--brand-text)" }}>
            <ShoppingBag size={17} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center" style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-fg)" }}>
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="storefront-mobile-menu"
            className="md:hidden w-10 h-10 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ color: "var(--brand-text)" }}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {/* Mobile menu — slides down under the header */}
      {menuOpen && (
        <nav
          id="storefront-mobile-menu"
          className="md:hidden border-t"
          style={{ backgroundColor: "var(--brand-bg)", borderColor: "color-mix(in srgb, var(--brand-text) 10%, transparent)" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
            {navLinks.map(link => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-3.5 text-base font-semibold border-b last:border-b-0 hover:opacity-70 transition-opacity"
                style={{ color: "var(--brand-text)", borderColor: "color-mix(in srgb, var(--brand-text) 8%, transparent)" }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
