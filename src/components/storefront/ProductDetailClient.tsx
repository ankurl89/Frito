"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandDNA, Product } from "@/lib/types";
import { useCart } from "@/lib/cart-store";
import { colorHex } from "@/lib/v1-commerce";
import StorefrontProductCard from "./StorefrontProductCard";
import { Truck, RotateCcw, Shield, Plus, Minus } from "lucide-react";
import toast from "react-hot-toast";

export default function ProductDetailClient({
  brand, product, related, slug, galleryImages = [], colorImages = {},
}: { brand: BrandDNA; product: Product; related: Product[]; slug: string; galleryImages?: string[]; colorImages?: Record<string, string> }) {
  const router = useRouter();
  const sizes = (product.variants || []).map(v => v.size).filter(Boolean) as string[];
  const colors = (product.colors || []) as string[];
  const [selectedSize, setSelectedSize] = useState<string | undefined>(sizes[0]);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const add = useCart(s => s.add);

  // Hero image for the selected color (falls back to default gallery/mockup).
  const colorHero = selectedColor ? colorImages[selectedColor.toLowerCase()] : undefined;
  const baseImages = (galleryImages.length > 0
    ? galleryImages
    : [product.mockup_url, product.artwork_url].filter(Boolean) as string[]);
  // When a non-default color is chosen, lead with its hero, then the close-ups.
  const images = colorHero ? [colorHero, ...baseImages.filter(u => u !== colorHero).slice(1)] : baseImages;
  const displayImage = images[activeImage] || colorHero || baseImages[0];

  function addToCart() {
    add({
      product_id: product.id,
      brand_id: product.brand_id,
      brand_slug: slug,
      name: product.name,
      size: selectedSize,
      color: selectedColor,
      price: product.sell_price,
      image: colorHero || product.mockup_url || product.artwork_url || "",
      quantity,
    });
    toast.success("Added to cart");
  }

  function buyNow() {
    addToCart();
    router.push(`/store/${slug}/cart`);
  }

  return (
    <div style={{ backgroundColor: "var(--brand-bg)", color: "var(--brand-text)" }}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs opacity-60 mb-6 flex items-center gap-1.5">
          <Link href={`/store/${slug}`} className="hover:opacity-100">Home</Link>
          <span>/</span>
          <Link href={`/store/${slug}/collection/${product.category?.toLowerCase().replace(/\s+/g, "-")}`} className="hover:opacity-100">{product.category}</Link>
          <span>/</span>
          <span className="opacity-60">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden mb-3" style={{ backgroundColor: "color-mix(in srgb, var(--brand-text) 4%, var(--brand-bg))" }}>
              {displayImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayImage} alt={product.name} className="w-full h-full object-cover" />
              ) : null}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${activeImage === i ? "" : "border-transparent opacity-60"}`}
                    style={activeImage === i ? { borderColor: "var(--brand-primary)" } : { backgroundColor: "color-mix(in srgb, var(--brand-text) 4%, var(--brand-bg))" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="font-mono text-[10px] tracking-widest opacity-60 mb-2">{brand.name?.toUpperCase()} · {product.category?.toUpperCase()}</p>
            <h1 className="text-4xl font-black tracking-tight mb-3" style={{ fontFamily: "var(--brand-headline-font)" }}>
              {product.listing_title || product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl font-black" style={{ color: "var(--brand-text)" }}>
                ₹{product.sell_price.toLocaleString("en-IN")}
              </span>
              {product.discount_price && product.discount_price < product.sell_price && (
                <span className="text-base opacity-50 line-through">₹{product.sell_price.toLocaleString("en-IN")}</span>
              )}
              <span className="text-xs opacity-60">incl. of all taxes</span>
            </div>

            {/* Description */}
            <p className="text-base opacity-80 leading-relaxed mb-8">
              {product.listing_description || product.description}
            </p>

            {/* Colors */}
            {colors.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-mono text-[10px] tracking-widest opacity-60">COLOR</p>
                  <span className="text-xs opacity-60">{selectedColor}</span>
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  {colors.map(c => (
                    <button
                      key={c}
                      onClick={() => { setSelectedColor(c); setActiveImage(0); }}
                      title={c}
                      className="relative w-9 h-9 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: colorHex(c),
                        borderColor: selectedColor === c ? "var(--brand-text)" : "color-mix(in srgb, var(--brand-text) 20%, transparent)",
                        transform: selectedColor === c ? "scale(1.1)" : "none",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-mono text-[10px] tracking-widest opacity-60">SIZE</p>
                  <button className="text-xs underline opacity-60 hover:opacity-100">Size guide</button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[3.5rem] px-4 py-2.5 rounded-lg border-2 font-bold text-sm transition-colors`}
                      style={
                        selectedSize === size
                          ? { backgroundColor: "var(--brand-text)", color: "var(--brand-bg)", borderColor: "var(--brand-text)" }
                          : { borderColor: "color-mix(in srgb, var(--brand-text) 20%, transparent)", color: "var(--brand-text)" }
                      }
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <p className="font-mono text-[10px] tracking-widest opacity-60 mb-3">QUANTITY</p>
              <div className="inline-flex items-center border-2 rounded-lg" style={{ borderColor: "color-mix(in srgb, var(--brand-text) 20%, transparent)" }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity">
                  <Minus size={14} />
                </button>
                <span className="w-12 text-center font-black">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <button onClick={addToCart} className="py-4 rounded-full font-bold border-2 transition-colors" style={{ borderColor: "var(--brand-text)", color: "var(--brand-text)" }}>
                Add to Cart
              </button>
              <button onClick={buyNow} className="py-4 rounded-full font-bold transition-transform hover:scale-[1.02]" style={{ backgroundColor: "var(--brand-primary)", color: "var(--brand-primary-fg)" }}>
                Buy Now
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 py-5 border-y" style={{ borderColor: "color-mix(in srgb, var(--brand-text) 10%, transparent)" }}>
              {[
                { icon: <Truck size={15} />, label: "Ships in 3-5 days" },
                { icon: <RotateCcw size={15} />, label: "Easy returns" },
                { icon: <Shield size={15} />, label: "Secure checkout" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-xs opacity-80">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Tags */}
            {product.seo_tags && product.seo_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-6">
                {product.seo_tags.slice(0, 6).map((t, i) => (
                  <span key={i} className="font-mono text-[10px] opacity-50">#{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-24">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-6" style={{ fontFamily: "var(--brand-headline-font)" }}>You might also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map(p => <StorefrontProductCard key={p.id} product={p} slug={slug} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
