/**
 * Merchant earnings & payouts (Phase 1).
 *
 * The ledger is DERIVED — no stored balance to drift out of sync:
 *   earned    = Σ profit_amount over revenue-status orders (all the user's brands)
 *   cleared   = earned, but only orders older than REFUND_BUFFER_DAYS
 *   available = cleared − Σ payouts already made
 *
 * Payouts are recorded from Mission Control after a manual bank transfer
 * (Phase 2 automates this via a payout rail). Bank + PAN live in
 * payout_accounts, which has RLS-without-policies: service-role only.
 * Everything returned to a browser is masked via toMaskedAccount().
 */

import { createServiceClient } from "@/lib/supabase/service";
import { isRevenueStatus } from "@/lib/mission-control/admin-data";

/** Days an order's profit stays "pending clearance" to absorb returns. */
export const REFUND_BUFFER_DAYS = 14;

/* ── Validation (Indian formats) ─────────────────────────────── */

export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const ACCOUNT_RE = /^[0-9]{6,20}$/;

export interface PayoutDetailsInput {
  account_holder: string;
  account_number: string;
  ifsc: string;
  pan: string;
}

/** Returns a human error message, or null when the input is valid. */
export function validatePayoutDetails(d: PayoutDetailsInput): string | null {
  if (!d.account_holder || d.account_holder.trim().length < 3) return "Enter the account holder's full name.";
  if (!ACCOUNT_RE.test(d.account_number)) return "Account number should be 6–20 digits.";
  if (!IFSC_RE.test(d.ifsc)) return "That IFSC code doesn't look right (e.g. HDFC0001234).";
  if (!PAN_RE.test(d.pan)) return "That PAN doesn't look right (e.g. ABCDE1234F).";
  return null;
}

/* ── Masking (what the browser is allowed to see) ────────────── */

export interface MaskedAccount {
  exists: boolean;
  status?: string;
  account_holder?: string;
  account_last4?: string;
  ifsc?: string;
  pan_masked?: string;
  updated_at?: string;
}

interface PayoutAccountRow {
  account_holder: string;
  account_number: string;
  ifsc: string;
  pan: string;
  status: string;
  updated_at: string;
}

export function toMaskedAccount(row: PayoutAccountRow | null): MaskedAccount {
  if (!row) return { exists: false };
  return {
    exists: true,
    status: row.status,
    account_holder: row.account_holder,
    account_last4: row.account_number.slice(-4),
    ifsc: row.ifsc,
    pan_masked: `${row.pan.slice(0, 3)}•••••${row.pan.slice(-2)}`,
    updated_at: row.updated_at,
  };
}

/* ── Earnings ledger (derived) ───────────────────────────────── */

export interface PayoutRecord {
  id: string;
  amount: number;
  status: string;
  reference: string | null;
  paid_at: string;
}

export interface Earnings {
  earned: number;        // lifetime profit on revenue-status orders
  pending: number;       // inside the refund buffer — not yet payable
  cleared: number;       // past the buffer
  paidOut: number;       // payouts already made
  available: number;     // cleared − paidOut (floored at 0)
  perBrand: { brandId: string; brandName: string; earned: number }[];
  payouts: PayoutRecord[];
}

export async function getEarnings(userId: string): Promise<Earnings> {
  const svc = createServiceClient();
  const cutoff = new Date(Date.now() - REFUND_BUFFER_DAYS * 86_400_000).toISOString();

  const { data: brands } = await svc.from("brands").select("id, name").eq("user_id", userId);
  const brandList = (brands || []) as { id: string; name: string }[];

  let earned = 0, cleared = 0;
  const perBrandMap = new Map<string, number>();

  if (brandList.length > 0) {
    const { data: orders } = await svc
      .from("orders")
      .select("brand_id, profit_amount, status, created_at")
      .in("brand_id", brandList.map(b => b.id));
    for (const o of (orders || []) as { brand_id: string; profit_amount: number; status: string; created_at: string }[]) {
      if (!isRevenueStatus(o.status)) continue;
      const profit = o.profit_amount || 0;
      earned += profit;
      if (o.created_at <= cutoff) cleared += profit;
      perBrandMap.set(o.brand_id, (perBrandMap.get(o.brand_id) || 0) + profit);
    }
  }

  const { data: payoutRows } = await svc
    .from("payouts")
    .select("id, amount, status, reference, paid_at")
    .eq("user_id", userId)
    .order("paid_at", { ascending: false });
  const payouts = (payoutRows || []) as PayoutRecord[];
  const paidOut = payouts.filter(p => p.status !== "cancelled").reduce((s, p) => s + Number(p.amount || 0), 0);

  return {
    earned,
    pending: earned - cleared,
    cleared,
    paidOut,
    available: Math.max(0, cleared - paidOut),
    perBrand: brandList
      .map(b => ({ brandId: b.id, brandName: b.name, earned: perBrandMap.get(b.id) || 0 }))
      .filter(b => b.earned > 0),
    payouts,
  };
}

/* ── Mission Control overview ────────────────────────────────── */

export interface PayoutOverviewRow {
  userId: string;
  email: string | null;
  brandNames: string[];
  earned: number;
  pending: number;
  available: number;
  paidOut: number;
  account: MaskedAccount;
  lastPayoutAt: string | null;
}

/** Every founder with earnings or payout details — for the staff payouts desk. */
export async function listPayoutOverview(): Promise<PayoutOverviewRow[]> {
  const svc = createServiceClient();
  const cutoff = new Date(Date.now() - REFUND_BUFFER_DAYS * 86_400_000).toISOString();

  const [{ data: brands }, { data: orders }, { data: payoutRows }, { data: accounts }, usersRes] = await Promise.all([
    svc.from("brands").select("id, name, user_id"),
    svc.from("orders").select("brand_id, profit_amount, status, created_at"),
    svc.from("payouts").select("user_id, amount, status, paid_at"),
    svc.from("payout_accounts").select("*"),
    svc.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const emails = new Map<string, string>();
  for (const u of usersRes.data?.users || []) if (u.email) emails.set(u.id, u.email);

  const brandOwner = new Map<string, string>();
  const brandName = new Map<string, string>();
  const userBrands = new Map<string, string[]>();
  for (const b of (brands || []) as { id: string; name: string; user_id: string }[]) {
    brandOwner.set(b.id, b.user_id);
    brandName.set(b.id, b.name);
    userBrands.set(b.user_id, [...(userBrands.get(b.user_id) || []), b.name]);
  }

  const agg = new Map<string, { earned: number; cleared: number }>();
  for (const o of (orders || []) as { brand_id: string; profit_amount: number; status: string; created_at: string }[]) {
    if (!isRevenueStatus(o.status)) continue;
    const owner = brandOwner.get(o.brand_id);
    if (!owner) continue;
    const a = agg.get(owner) || { earned: 0, cleared: 0 };
    const profit = o.profit_amount || 0;
    a.earned += profit;
    if (o.created_at <= cutoff) a.cleared += profit;
    agg.set(owner, a);
  }

  const paid = new Map<string, { total: number; last: string | null }>();
  for (const p of (payoutRows || []) as { user_id: string; amount: number; status: string; paid_at: string }[]) {
    if (p.status === "cancelled") continue;
    const cur = paid.get(p.user_id) || { total: 0, last: null };
    cur.total += Number(p.amount || 0);
    if (!cur.last || p.paid_at > cur.last) cur.last = p.paid_at;
    paid.set(p.user_id, cur);
  }

  const accountByUser = new Map<string, PayoutAccountRow & { user_id: string }>();
  for (const a of (accounts || []) as (PayoutAccountRow & { user_id: string })[]) accountByUser.set(a.user_id, a);

  // Union of everyone with earnings or payout details.
  const userIds = new Set<string>([...agg.keys(), ...accountByUser.keys()]);

  return [...userIds]
    .map(userId => {
      const a = agg.get(userId) || { earned: 0, cleared: 0 };
      const p = paid.get(userId) || { total: 0, last: null };
      return {
        userId,
        email: emails.get(userId) ?? null,
        brandNames: userBrands.get(userId) || [],
        earned: a.earned,
        pending: a.earned - a.cleared,
        available: Math.max(0, a.cleared - p.total),
        paidOut: p.total,
        account: toMaskedAccount(accountByUser.get(userId) ?? null),
        lastPayoutAt: p.last,
      };
    })
    .sort((x, y) => y.available - x.available);
}
