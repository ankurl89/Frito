import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "@/lib/nanoid";
import { snapshotVersion, logActivity } from "@/lib/product-lifecycle";
import { awardXP } from "@/lib/founder-engine";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const brandId = req.nextUrl.searchParams.get("brand_id");
  const status = req.nextUrl.searchParams.get("status");
  const search = req.nextUrl.searchParams.get("q");
  const sort = req.nextUrl.searchParams.get("sort") || "created_at";

  let query = supabase.from("products").select("*");
  if (brandId) query = query.eq("brand_id", brandId);
  if (status && status !== "all") {
    // legacy "active" rows count as "published"
    if (status === "published") query = query.in("status", ["published", "active"]);
    else query = query.eq("status", status);
  }
  if (search) query = query.ilike("name", `%${search}%`);

  const orderCol = ["created_at", "sell_price", "name"].includes(sort) ? sort : "created_at";
  const { data, error } = await query.order(orderCol, { ascending: sort === "name" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const sku = body.sku || `${body.brand_id?.slice(0, 4).toUpperCase()}-${nanoid(6).toUpperCase()}`;

  // Price floor: selling below production cost creates negative-profit orders.
  if (body.base_cost != null && body.sell_price != null && Number(body.sell_price) < Number(body.base_cost)) {
    return NextResponse.json(
      { error: `Selling price can't be below the production cost (₹${body.base_cost}).` },
      { status: 400 }
    );
  }

  // Normalize legacy "active" → "published"
  const status = body.status === "active" ? "published" : (body.status || "draft");
  const published_at = status === "published" ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("products")
    .insert({ ...body, sku, status, published_at, version: 1 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await snapshotVersion({ productId: data.id, snapshot: data, changeType: "create", summary: "Product created" });
  await logActivity({ productId: data.id, userId: user.id, action: "create", details: { name: data.name, status } });

  // Founder XP — product created (always) + published (if launched immediately).
  awardXP(user.id, "product_created", { product_id: data.id, name: data.name })
    .catch(err => console.error("awardXP product_created failed:", err));
  if (status === "published") {
    awardXP(user.id, "product_published", { product_id: data.id })
      .catch(err => console.error("awardXP product_published failed:", err));
  }

  return NextResponse.json(data);
}
