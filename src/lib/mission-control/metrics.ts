/**
 * Mission Control metric resolvers.
 *
 * All reads use the service client (cross-tenant). Callers MUST have verified
 * staff access first (the layout does this). Kept as small composable functions
 * so the Copilot module can later reuse them as tools.
 */

import { createServiceClient } from "@/lib/supabase/service";

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function startOfMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export interface ExecutiveMetrics {
  merchants: { total: number; newToday: number; newMonth: number; active: number };
  revenue: { gmvToday: number; gmvMonth: number; profitMonth: number; aov: number };
  orders: { today: number; byState: Record<string, number>; total: number };
  ops: {
    fulfillmentSuccessRate: number;
    queueQueued: number;
    queueFailed: number;
    queueDead: number;
  };
}

export async function getExecutiveMetrics(): Promise<ExecutiveMetrics> {
  const svc = createServiceClient();
  const today = startOfToday();
  const month = startOfMonth();

  const [
    brandsTotal, brandsToday, brandsMonth,
    publishedProducts,
    ordersAll, ordersToday,
    jobsQueued, jobsFailed, jobsDead,
  ] = await Promise.all([
    svc.from("brands").select("id", { count: "exact", head: true }),
    svc.from("brands").select("id", { count: "exact", head: true }).gte("created_at", today),
    svc.from("brands").select("id", { count: "exact", head: true }).gte("created_at", month),
    svc.from("products").select("brand_id").eq("status", "published"),
    svc.from("orders").select("status, total_amount, profit_amount, created_at"),
    svc.from("orders").select("id", { count: "exact", head: true }).gte("created_at", today),
    svc.from("job_queue").select("id", { count: "exact", head: true }).eq("status", "queued"),
    svc.from("job_queue").select("id", { count: "exact", head: true }).eq("status", "failed"),
    svc.from("job_queue").select("id", { count: "exact", head: true }).eq("status", "dead"),
  ]);

  const orders = (ordersAll.data || []) as { status: string; total_amount: number; profit_amount: number; created_at: string }[];

  const byState: Record<string, number> = {};
  let gmvToday = 0, gmvMonth = 0, profitMonth = 0, gmvAllForAov = 0, paidCount = 0;
  for (const o of orders) {
    byState[o.status] = (byState[o.status] || 0) + 1;
    const isRevenue = !["cancelled", "refunded", "failed", "pending_payment"].includes(o.status);
    if (isRevenue) {
      if (o.created_at >= today) gmvToday += o.total_amount || 0;
      if (o.created_at >= month) { gmvMonth += o.total_amount || 0; profitMonth += o.profit_amount || 0; }
      gmvAllForAov += o.total_amount || 0;
      paidCount += 1;
    }
  }

  const activeBrandIds = new Set((publishedProducts.data || []).map(p => p.brand_id));
  const failedOrders = byState["failed"] || 0;
  const totalOrders = orders.length;
  const fulfillmentSuccessRate = totalOrders > 0
    ? Math.round(((totalOrders - failedOrders) / totalOrders) * 1000) / 10
    : 100;

  return {
    merchants: {
      total: brandsTotal.count ?? 0,
      newToday: brandsToday.count ?? 0,
      newMonth: brandsMonth.count ?? 0,
      active: activeBrandIds.size,
    },
    revenue: {
      gmvToday,
      gmvMonth,
      profitMonth,
      aov: paidCount > 0 ? Math.round(gmvAllForAov / paidCount) : 0,
    },
    orders: {
      today: ordersToday.count ?? 0,
      byState,
      total: totalOrders,
    },
    ops: {
      fulfillmentSuccessRate,
      queueQueued: jobsQueued.count ?? 0,
      queueFailed: jobsFailed.count ?? 0,
      queueDead: jobsDead.count ?? 0,
    },
  };
}
