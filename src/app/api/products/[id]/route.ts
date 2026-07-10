import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { snapshotVersion, logActivity, hasActiveOrders } from "@/lib/product-lifecycle";
import { awardXP } from "@/lib/founder-engine";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

const EDIT_FIELDS = [
  "name", "description", "sell_price", "discount_price",
  "listing_title", "listing_description", "seo_tags", "tags",
  "url_slug", "meta_title", "meta_description",
  "artwork_url", "design_url", "mockup_url", "production_file_url", "placement", "template_view",
  "colors", "variants",
  "status",
] as const;

/**
 * PATCH /api/products/[id] — edit product
 *
 * Body: partial Product. Records audit + snapshot.
 * Determines change_type from which fields changed.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Whitelist editable fields.
  const update: Record<string, unknown> = {};
  for (const key of EDIT_FIELDS) {
    if (key in body) update[key] = body[key];
  }

  // Order protection: if product has orders, block artwork/production-file changes.
  if ("artwork_url" in update || "production_file_url" in update) {
    const blocked = await hasActiveOrders(id);
    if (blocked) {
      return NextResponse.json(
        { error: "This product has active orders. Artwork and production files cannot be changed to protect fulfillment." },
        { status: 409 }
      );
    }
  }

  // Load the current row once — the gates below compare against it.
  const { data: current } = await supabase
    .from("products")
    .select("base_cost, status, production_file_url, validation_report, visualization_score")
    .eq("id", id)
    .single();

  // Price floor: never allow a sell price below production cost — it would
  // create negative-profit orders that flow straight into the payout ledger.
  if ("sell_price" in update && current?.base_cost != null) {
    const price = Number(update.sell_price);
    if (!Number.isFinite(price) || price < Number(current.base_cost)) {
      return NextResponse.json(
        { error: `Selling price can't be below the production cost (₹${current.base_cost}).` },
        { status: 400 }
      );
    }
  }

  // Artwork changed → the previously rendered mockup/production file/score no
  // longer describe this product. Invalidate them (the artwork editor re-runs
  // the render pipeline immediately after, which restores them).
  if ("artwork_url" in update && !("production_file_url" in update)) {
    update.production_file_url = null;
    update.mockup_url = null;
    update.visualization_score = null;
    update.validation_report = null;
  }

  // Publish gate (server-side; the client gate alone is bypassable): a product
  // may only go live with a print-ready production file and a passing
  // visualization score. This is what guarantees customers can't buy something
  // that can't be printed faithfully.
  if (update.status === "published" && current?.status !== "published") {
    const report = current?.validation_report as { score?: { publishable?: boolean } } | null;
    const hasProductionFile = Boolean(current?.production_file_url) && !("production_file_url" in update && !update.production_file_url);
    if (!hasProductionFile) {
      return NextResponse.json(
        { error: "This product has no print-ready file yet. Open the artwork editor and save to regenerate it, then publish." },
        { status: 409 }
      );
    }
    if (report?.score && report.score.publishable === false) {
      return NextResponse.json(
        { error: "This product's visualization score is below the publish threshold. Improve the artwork (resolution/transparency/placement) and try again." },
        { status: 409 }
      );
    }
  }

  // Side-effects on lifecycle transitions.
  if (update.status === "published") update.published_at = new Date().toISOString();
  if (update.status === "archived") update.archived_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("products")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Determine change type.
  const changeType =
    "artwork_url" in update || "mockup_url" in update ? "artwork" :
    "sell_price" in update || "discount_price" in update ? "pricing" :
    update.status === "published" ? "publish" :
    update.status === "archived" ? "archive" :
    "edit";

  const summary = summariseChange(update);

  await snapshotVersion({ productId: id, snapshot: data, changeType, summary });
  await logActivity({ productId: id, userId: user.id, action: changeType, details: { fields: Object.keys(update), summary } });

  // Founder XP — product transitioning to published.
  if (update.status === "published") {
    awardXP(user.id, "product_published", { product_id: id })
      .catch(err => console.error("awardXP product_published failed:", err));
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/products/[id]
 *
 * If product has orders → auto-archive instead (per PRD).
 * Otherwise hard delete.
 */
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hasOrders = await hasActiveOrders(id);
  if (hasOrders) {
    // Auto-archive instead of deleting.
    const { data, error } = await supabase
      .from("products")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logActivity({
      productId: id, userId: user.id, action: "archive",
      details: { reason: "auto-archived because product has orders" },
    });
    await snapshotVersion({ productId: id, snapshot: data, changeType: "archive", summary: "Auto-archived (has orders)" });

    return NextResponse.json({ action: "archived", product: data, message: "Auto-archived because this product has previous orders." });
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ action: "deleted" });
}

function summariseChange(update: Record<string, unknown>): string {
  const keys = Object.keys(update);
  if (keys.includes("status") && update.status === "published") return "Product published";
  if (keys.includes("status") && update.status === "archived") return "Product archived";
  if (keys.includes("status") && update.status === "draft") return "Product unpublished";
  if (keys.includes("artwork_url")) return "Artwork updated";
  if (keys.includes("sell_price") || keys.includes("discount_price")) return "Pricing updated";
  if (keys.includes("listing_title") || keys.includes("listing_description")) return "Listing updated";
  return `Updated: ${keys.join(", ")}`;
}
