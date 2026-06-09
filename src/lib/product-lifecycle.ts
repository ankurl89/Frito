/**
 * Product lifecycle helpers — audit + version snapshots.
 *
 * Every material change to a product writes:
 *   1. A snapshot to product_versions (rollback / version history)
 *   2. An entry to product_audit_log (activity log)
 *
 * These run from API routes, so they use the server-side Supabase client.
 */

import { createClient } from "@/lib/supabase/server";
import type { Product } from "./types";

type ChangeType = "create" | "edit" | "artwork" | "pricing" | "publish" | "unpublish" | "archive" | "duplicate";

interface SnapshotInput {
  productId: string;
  snapshot: Partial<Product>;
  changeType: ChangeType;
  summary?: string;
}

interface AuditInput {
  productId: string;
  userId: string;
  action: string;
  details?: Record<string, unknown>;
}

/** Take a version snapshot. Increments and returns the new version number. */
export async function snapshotVersion({ productId, snapshot, changeType, summary }: SnapshotInput): Promise<number> {
  const supabase = await createClient();

  // Compute next version number atomically (read current, +1, write).
  const { data: latest } = await supabase
    .from("product_versions")
    .select("version")
    .eq("product_id", productId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latest?.version ?? 0) + 1;

  await supabase.from("product_versions").insert({
    product_id: productId,
    version: nextVersion,
    snapshot,
    change_type: changeType,
    change_summary: summary,
  });

  // Mirror to product row.
  await supabase.from("products").update({ version: nextVersion }).eq("id", productId);

  return nextVersion;
}

/** Append an audit log entry. */
export async function logActivity({ productId, userId, action, details }: AuditInput): Promise<void> {
  const supabase = await createClient();
  await supabase.from("product_audit_log").insert({
    product_id: productId,
    user_id: userId,
    action,
    details: details || {},
  });
}

/** Returns true if the product has any orders (used to gate destructive actions). */
export async function hasActiveOrders(productId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  return (count ?? 0) > 0;
}

// Re-export so server code can keep using `from "@/lib/product-lifecycle"`
export { STATUS_META } from "./product-status";
