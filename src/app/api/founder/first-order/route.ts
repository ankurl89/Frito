import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/founder/first-order
 *
 * Returns the founder's very first order (used by the FirstSaleCelebration overlay).
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: brands } = await supabase.from("brands").select("id").eq("user_id", user.id);
  const brandIds = (brands || []).map(b => b.id);
  if (!brandIds.length) return NextResponse.json(null);

  const { data: order } = await supabase
    .from("orders")
    .select("id, total_amount, customer_name, shipping_address, product_id, created_at")
    .in("brand_id", brandIds)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!order) return NextResponse.json(null);

  // Resolve product name + customer city.
  let productName = "your product";
  if (order.product_id) {
    const { data: product } = await supabase
      .from("products")
      .select("name")
      .eq("id", order.product_id)
      .single();
    if (product?.name) productName = product.name;
  }

  const customerCity = (order.shipping_address as { city?: string })?.city;

  return NextResponse.json({
    id: order.id,
    total_amount: order.total_amount,
    product_name: productName,
    customer_city: customerCity,
  });
}
