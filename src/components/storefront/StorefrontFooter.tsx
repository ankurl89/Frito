import Link from "next/link";
import { BrandDNA } from "@/lib/types";

export default function StorefrontFooter({ brand }: { brand: BrandDNA }) {
  return (
    <footer className="border-t mt-20" style={{ backgroundColor: "color-mix(in srgb, var(--brand-text) 4%, var(--brand-bg))", borderColor: "color-mix(in srgb, var(--brand-text) 10%, transparent)" }}>
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <p className="font-black text-2xl tracking-tight mb-2" style={{ color: "var(--brand-text)", fontFamily: "var(--brand-headline-font)" }}>
            {brand.name}
          </p>
          <p className="text-sm opacity-60 italic" style={{ color: "var(--brand-text)" }}>&ldquo;{brand.tagline}&rdquo;</p>
        </div>
        {[
          { label: "Shop", links: [["All Products", `/store/${brand.slug}/collection/all`]] },
          { label: "Help", links: [["Track Order", `/store/${brand.slug}/track`], ["Contact", "#"], ["Returns", "#"]] },
        ].map(group => (
          <div key={group.label}>
            <p className="font-mono text-[10px] tracking-widest opacity-60 mb-3" style={{ color: "var(--brand-text)" }}>{group.label.toUpperCase()}</p>
            <ul className="space-y-2">
              {group.links.map(([label, href]) => (
                <li key={label}><Link href={href} className="text-sm hover:opacity-70 transition-opacity" style={{ color: "var(--brand-text)" }}>{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t" style={{ borderColor: "color-mix(in srgb, var(--brand-text) 10%, transparent)" }}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between gap-3 text-xs opacity-60" style={{ color: "var(--brand-text)" }}>
          <p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
          <p>Powered by <Link href="/" className="hover:underline">Frito AI</Link></p>
        </div>
      </div>
    </footer>
  );
}
