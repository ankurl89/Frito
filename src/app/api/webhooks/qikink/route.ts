import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Qikink sends webhooks when order status changes
// Register this URL in your Qikink dashboard: https://yourdomain.com/api/webhooks/qikink
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { production_id, status, tracking_number, courier } = body;

    if (!production_id) {
      return NextResponse.json({ error: "Missing production_id" }, { status: 400 });
    }

    const supabase = await createClient();

    // Map Qikink status to our internal status
    const statusMap: Record<string, string> = {
      "Order Confirmed": "confirmed",
      "In Production": "in_production",
      "Ready to Ship": "ready_to_ship",
      "Shipped": "shipped",
      "Delivered": "delivered",
      "Cancelled": "cancelled",
    };

    const internalStatus = statusMap[status] || status.toLowerCase().replace(" ", "_");

    const updateData: Record<string, unknown> = { status: internalStatus };
    if (tracking_number) updateData.tracking_number = tracking_number;
    if (courier) updateData.courier = courier;

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("qikink_order_id", production_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Qikink webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
