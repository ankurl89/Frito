/**
 * Product Detail page.
 *
 * Gallery is composed from the digital twin's mockup(s) — the supplier
 * template + composited artwork. No AI-generated product photo.
 * Description, related products, and delivery estimate all derive from
 * the brand's documented identity.
 */

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Product } from "@/lib/types";
import { Truck, RotateCcw, Shield } from "lucide-react";
import ProductDetailClient from "@/components/storefront/ProductDetailClient";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string; productId: string }> }) {
  const { slug, productId } = await params;
  const supabase = await createClient();

  const { data: brand } = await supabase.from("brands").select("*").eq("slug", slug).single();
  if (!brand) notFound();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("brand_id", brand.id)
    .single();

  if (!product) notFound();

  // PVE asset set for the gallery (primary + close-up), highest quality first.
  const { data: assets } = await supabase
    .from("product_assets")
    .select("asset_type, url")
    .eq("product_id", productId);

  // Related products — same brand, same category, not this product.
  const { data: related } = await supabase
    .from("products")
    .select("*")
    .eq("brand_id", brand.id)
    .eq("category", product.category)
    .in("status", ["published", "active"])
    .neq("id", productId)
    .limit(4);

  // Gallery order: primary → closeup → fall back to mockup/artwork.
  const order = ["primary", "closeup", "back", "angle_45", "lifestyle"];
  const galleryImages = (assets || [])
    .filter(a => order.includes(a.asset_type))
    .sort((a, b) => order.indexOf(a.asset_type) - order.indexOf(b.asset_type))
    .map(a => a.url);

  return (
    <ProductDetailClient
      brand={brand}
      product={product as Product}
      related={(related || []) as Product[]}
      slug={slug}
      galleryImages={galleryImages}
    />
  );
}
