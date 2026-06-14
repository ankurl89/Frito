/**
 * Mission Control cross-tenant data resolvers.
 *
 * Like metrics.ts: small composable functions that read across ALL merchants
 * via the service client. Callers MUST have verified staff access first (the
 * layout + per-page permission checks do this).
 *
 * Kept dependency-light so the Copilot module can later reuse these as tools.
 */

import { createServiceClient } from "@/lib/supabase/service";
import { StaffRole } from "./rbac";

/** Order statuses that do NOT count as realised revenue. */
const NON_REVENUE = new Set(["cancelled", "refunded", "failed", "pending_payment"]);
export function isRevenueStatus(status: string): boolean {
  return !NON_REVENUE.has(status);
}

/** Map of auth user id → email. One call, best-effort (young platform scale). */
async function ownerEmailMap(): Promise<Map<string, string>> {
  const svc = createServiceClient();
  const map = new Map<string, string>();
  try {
    const { data } = await svc.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of data?.users || []) {
      if (u.email) map.set(u.id, u.email);
    }
  } catch (err) {
    console.error("listUsers failed (emails will show as —):", err);
  }
  return map;
}

/* ────────────────────────────────────────────────────────────── Merchants */

export type MerchantDisplayStatus = "live" | "draft" | "suspended";

export interface MerchantRow {
  id: string;
  name: string;
  slug: string | null;
  status: string;                       // raw DB status (used by suspend logic)
  displayStatus: MerchantDisplayStatus; // what the team should see
  priceTier: string | null;
  niche: string | null;
  ownerEmail: string | null;
  createdAt: string;
  liveProducts: number;
  orders: number;
  revenue: number;
  profit: number;
  lastOrderAt: string | null;
}

export async function listMerchants(): Promise<MerchantRow[]> {
  const svc = createServiceClient();
  const [{ data: brands }, { data: orders }, { data: products }, emails] = await Promise.all([
    svc.from("brands").select("id, name, slug, status, price_tier, niche, user_id, created_at").order("created_at", { ascending: false }),
    svc.from("orders").select("brand_id, total_amount, profit_amount, status, created_at"),
    svc.from("products").select("brand_id, status"),
    ownerEmailMap(),
  ]);

  const ord = (orders || []) as { brand_id: string; total_amount: number; profit_amount: number; status: string; created_at: string }[];
  const prod = (products || []) as { brand_id: string; status: string }[];

  // Per-brand rollups.
  const agg = new Map<string, { orders: number; revenue: number; profit: number; lastOrderAt: string | null }>();
  for (const o of ord) {
    const a = agg.get(o.brand_id) || { orders: 0, revenue: 0, profit: 0, lastOrderAt: null };
    a.orders += 1;
    if (isRevenueStatus(o.status)) {
      a.revenue += o.total_amount || 0;
      a.profit += o.profit_amount || 0;
    }
    if (!a.lastOrderAt || o.created_at > a.lastOrderAt) a.lastOrderAt = o.created_at;
    agg.set(o.brand_id, a);
  }

  const liveProd = new Map<string, number>();
  for (const p of prod) {
    if (p.status === "published" || p.status === "active") {
      liveProd.set(p.brand_id, (liveProd.get(p.brand_id) || 0) + 1);
    }
  }

  return ((brands || []) as Record<string, string>[]).map(b => {
    const a = agg.get(b.id) || { orders: 0, revenue: 0, profit: 0, lastOrderAt: null };
    const live = liveProd.get(b.id) || 0;
    const rawStatus = b.status || "draft";
    const displayStatus: MerchantDisplayStatus =
      rawStatus === "suspended" ? "suspended" : live > 0 ? "live" : "draft";
    return {
      id: b.id,
      name: b.name,
      slug: b.slug ?? null,
      status: rawStatus,
      displayStatus,
      priceTier: b.price_tier ?? null,
      niche: b.niche ?? null,
      ownerEmail: emails.get(b.user_id) ?? null,
      createdAt: b.created_at,
      liveProducts: live,
      orders: a.orders,
      revenue: a.revenue,
      profit: a.profit,
      lastOrderAt: a.lastOrderAt,
    };
  });
}

export interface MerchantDetail {
  brand: Record<string, unknown>;
  ownerEmail: string | null;
  totals: { orders: number; revenue: number; profit: number; liveProducts: number };
  products: { id: string; name: string; status: string; base_price: number | null; category: string | null }[];
  recentOrders: { id: string; status: string; total_amount: number; created_at: string; customer_name: string; product_name: string | null }[];
}

export async function getMerchantDetail(brandId: string): Promise<MerchantDetail | null> {
  const svc = createServiceClient();
  const { data: brand } = await svc.from("brands").select("*").eq("id", brandId).single();
  if (!brand) return null;

  const [{ data: products }, { data: orders }, emails] = await Promise.all([
    svc.from("products").select("id, name, status, base_price, category").eq("brand_id", brandId).order("created_at", { ascending: false }),
    svc.from("orders").select("id, status, total_amount, profit_amount, created_at, customer_name, products(name)").eq("brand_id", brandId).order("created_at", { ascending: false }),
    ownerEmailMap(),
  ]);

  const ord = (orders || []) as unknown as { id: string; status: string; total_amount: number; profit_amount: number; created_at: string; customer_name: string; products: { name: string } | null }[];
  const prod = (products || []) as { id: string; name: string; status: string; base_price: number | null; category: string | null }[];

  let revenue = 0, profit = 0;
  for (const o of ord) {
    if (isRevenueStatus(o.status)) { revenue += o.total_amount || 0; profit += o.profit_amount || 0; }
  }

  return {
    brand: brand as Record<string, unknown>,
    ownerEmail: emails.get((brand as { user_id: string }).user_id) ?? null,
    totals: {
      orders: ord.length,
      revenue,
      profit,
      liveProducts: prod.filter(p => p.status === "published" || p.status === "active").length,
    },
    products: prod,
    recentOrders: ord.slice(0, 20).map(o => ({
      id: o.id, status: o.status, total_amount: o.total_amount, created_at: o.created_at,
      customer_name: o.customer_name, product_name: o.products?.name ?? null,
    })),
  };
}

/* ────────────────────────────────────────────────────────────── Customers */

export interface CustomerRow {
  email: string;
  name: string;
  orders: number;
  spend: number;
  brands: number;
  lastOrderAt: string;
}

export async function listCustomers(): Promise<CustomerRow[]> {
  const svc = createServiceClient();
  const { data: orders } = await svc
    .from("orders")
    .select("customer_email, customer_name, total_amount, status, brand_id, created_at");

  const ord = (orders || []) as { customer_email: string; customer_name: string; total_amount: number; status: string; brand_id: string; created_at: string }[];

  const map = new Map<string, { name: string; orders: number; spend: number; brands: Set<string>; lastOrderAt: string }>();
  for (const o of ord) {
    const key = (o.customer_email || "").toLowerCase();
    if (!key) continue;
    const c = map.get(key) || { name: o.customer_name, orders: 0, spend: 0, brands: new Set<string>(), lastOrderAt: o.created_at };
    c.orders += 1;
    if (isRevenueStatus(o.status)) c.spend += o.total_amount || 0;
    if (o.brand_id) c.brands.add(o.brand_id);
    if (o.created_at > c.lastOrderAt) c.lastOrderAt = o.created_at;
    if (o.customer_name) c.name = c.name || o.customer_name;
    map.set(key, c);
  }

  return [...map.entries()]
    .map(([email, c]) => ({ email, name: c.name || "—", orders: c.orders, spend: c.spend, brands: c.brands.size, lastOrderAt: c.lastOrderAt }))
    .sort((a, b) => b.spend - a.spend);
}

/* ────────────────────────────────────────────────────────────────── Audit */

export interface AuditRow {
  id: string;
  actorEmail: string | null;
  actorRole: StaffRole | string;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  ip: string | null;
  createdAt: string;
}

export async function listAuditLog(limit = 200): Promise<AuditRow[]> {
  const svc = createServiceClient();
  const [{ data: rows }, emails] = await Promise.all([
    svc.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(limit),
    ownerEmailMap(),
  ]);

  return ((rows || []) as Record<string, string>[]).map(r => ({
    id: r.id,
    actorEmail: emails.get(r.actor_id) ?? null,
    actorRole: (r.actor_role as StaffRole) || "—",
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    before: r.before_state,
    after: r.after_state,
    ip: r.ip ?? null,
    createdAt: r.created_at,
  }));
}
