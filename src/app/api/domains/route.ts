import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { STORE_DOMAIN } from "@/lib/domains";

/**
 * Custom domain connect/disconnect for a brand's storefront.
 *
 *   POST   { brandId, domain }  → attach a custom domain (status: pending)
 *   DELETE ?brandId=...         → remove the custom domain
 *
 * Saves to brands.custom_domain. DNS + Vercel provisioning are returned as
 * instructions; live Vercel API provisioning is layered on when a VERCEL_TOKEN
 * is configured (see /CUSTOM_DOMAINS.md).
 */

function cleanDomain(input: string): string | null {
  const d = (input || "").toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:.*$/, "");
  // Basic hostname validation: labels of a-z0-9-, at least one dot.
  if (!/^(?=.{1,253}$)([a-z0-9](-?[a-z0-9])*\.)+[a-z]{2,}$/.test(d)) return null;
  return d;
}

async function ownBrand(brandId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 as const };
  const { data: brand } = await supabase
    .from("brands").select("id, slug").eq("id", brandId).eq("user_id", user.id).maybeSingle();
  if (!brand) return { error: "Brand not found", status: 404 as const };
  return { brand };
}

export async function POST(req: NextRequest) {
  const { brandId, domain } = await req.json();
  const owned = await ownBrand(brandId);
  if ("error" in owned) return NextResponse.json({ error: owned.error }, { status: owned.status });

  const clean = cleanDomain(domain || "");
  if (!clean) return NextResponse.json({ error: "Enter a valid domain, e.g. shop.yourbrand.com" }, { status: 400 });
  if (STORE_DOMAIN && (clean === STORE_DOMAIN || clean.endsWith(`.${STORE_DOMAIN}`))) {
    return NextResponse.json({ error: `Use a domain you own, not ${STORE_DOMAIN}.` }, { status: 400 });
  }

  const svc = createServiceClient();
  // Guard against a domain already claimed by another brand.
  const { data: existing } = await svc.from("brands").select("id").eq("custom_domain", clean).neq("id", brandId).maybeSingle();
  if (existing) return NextResponse.json({ error: "That domain is already connected to another store." }, { status: 409 });

  const { error } = await svc.from("brands")
    .update({ custom_domain: clean, domain_status: "pending" })
    .eq("id", brandId);
  if (error) {
    return NextResponse.json({ error: `Could not save domain: ${error.message}` }, { status: 500 });
  }

  // DNS the merchant must set. Apex domains use an A record; subdomains a CNAME.
  const isApex = clean.split(".").length === 2;
  const dns = isApex
    ? { type: "A", name: "@", value: "76.76.21.21" }
    : { type: "CNAME", name: clean.split(".")[0], value: "cname.vercel-dns.com" };

  return NextResponse.json({ domain: clean, status: "pending", dns });
}

export async function DELETE(req: NextRequest) {
  const brandId = req.nextUrl.searchParams.get("brandId") || "";
  const owned = await ownBrand(brandId);
  if ("error" in owned) return NextResponse.json({ error: owned.error }, { status: owned.status });

  const svc = createServiceClient();
  await svc.from("brands").update({ custom_domain: null, domain_status: null }).eq("id", brandId);
  return NextResponse.json({ ok: true });
}
