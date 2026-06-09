import Link from "next/link";
import { Product } from "@/lib/types";

export default function StorefrontProductCard({ product, slug }: { product: Product; slug: string }) {
  const img = product.mockup_url || product.artwork_url || product.design_url;
  return (
    <Link href={`/store/${slug}/p/${product.id}`} className="group block">
      <div className="aspect-square rounded-2xl overflow-hidden mb-3" style={{ backgroundColor: "color-mix(in srgb, var(--brand-text) 4%, var(--brand-bg))" }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>
      <div className="px-1">
        <p className="font-bold text-sm mb-1 line-clamp-1" style={{ color: "var(--brand-text)" }}>{product.listing_title || product.name}</p>
        <p className="font-black text-sm" style={{ color: "var(--brand-text)" }}>
          ₹{product.sell_price.toLocaleString("en-IN")}
          {product.discount_price && product.discount_price < product.sell_price && (
            <span className="ml-2 text-xs line-through opacity-50">₹{product.sell_price.toLocaleString("en-IN")}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
