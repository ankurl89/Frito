import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { guardIp } from "@/lib/guardrails/guard";

/**
 * POST /api/store/orders/lookup — customer order lookup for the Track page.
 *
 * Requires BOTH the order reference (the #XXXXXXXX shown at checkout/in email)
 * AND the email used on the order — either alone is not enough, so a stranger
 * can't enumerate someone's orders. Rate-limited by IP.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (!(await guardIp(ip, "order_lookup", 15))) {
    return NextResponse.json({ error: "Too many attempts. Please wait a moment." }, { status: 429 });
  }

  const { brand_slug, email, reference } = await req.json();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanRef = String(reference || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

  if (!brand_slug || !cleanEmail.includes("@") || cleanRef.length < 6) {
    return NextResponse.json({ error: "Enter the email you ordered with and your order number (e.g. AB12CD34)." }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data: brand } = await svc.from("brands").select("id").eq("slug", brand_slug).single();
  if (!brand) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  const { data: orders } = await svc
    .from("orders")
    .select("id, status, created_at")
    .eq("brand_id", brand.id)
    .ilike("customer_email", cleanEmail)
    .order("created_at", { ascending: false })
    .limit(50);

  const match = (orders || []).find(o => o.id.replace(/-/g, "").toLowerCase().startsWith(cleanRef));
  if (!match) {
    return NextResponse.json(
      { error: "No order found for that email and order number. Double-check both — the order number looks like #AB12CD34." },
      { status: 404 }
    );
  }

  return NextResponse.json({ id: match.id });
}
