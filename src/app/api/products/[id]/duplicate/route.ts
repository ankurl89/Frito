import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { snapshotVersion, logActivity } from "@/lib/product-lifecycle";
import { nanoid } from "@/lib/nanoid";

/**
 * POST /api/products/[id]/duplicate
 *
 * Clones a product as a Draft. Appends "V2" / "V3" etc. to the name.
 * Mockup and artwork URLs are copied (still point to original assets — merchant
 * can replace later via the edit flow).
 */
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: original, error: e1 } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (e1 || !original) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Find next version suffix (V2, V3, …)
  const baseName = original.name.replace(/\s+V\d+$/, "");
  const { data: siblings } = await supabase
    .from("products")
    .select("name")
    .eq("brand_id", original.brand_id)
    .ilike("name", `${baseName}%`);
  const count = (siblings?.length ?? 0) + 1;
  const newName = count > 1 ? `${baseName} V${count}` : baseName;

  const sku = `${original.brand_id?.slice(0, 4).toUpperCase()}-${nanoid(6).toUpperCase()}`;

  // Build the clone — drop id/timestamps, reset lifecycle.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, created_at: _c, updated_at: _u, published_at: _p, archived_at: _a, version: _v, ...rest } = original;

  const { data: clone, error: e2 } = await supabase
    .from("products")
    .insert({
      ...rest,
      name: newName,
      sku,
      status: "draft",
      version: 1,
    })
    .select()
    .single();
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  await snapshotVersion({
    productId: clone.id, snapshot: clone, changeType: "create",
    summary: `Duplicated from "${original.name}"`,
  });
  await logActivity({
    productId: clone.id, userId: user.id, action: "duplicate",
    details: { source_product_id: original.id, source_name: original.name },
  });

  return NextResponse.json(clone);
}
