/**
 * Immutable admin audit logging.
 *
 * Every privileged Mission Control action calls this. The admin_audit_log
 * table has RLS enabled with no insert/update/delete policies for normal
 * roles — only the service client writes, and nothing can mutate a row after
 * the fact. This is the compliance trail.
 */

import { createServiceClient } from "@/lib/supabase/service";
import { StaffContext } from "./auth";

interface AuditInput {
  staff: StaffContext;
  action: string;                       // e.g. "order.retry", "order.cancel"
  entityType: string;                   // "order" | "merchant" | "job" | ...
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logAdminAction(input: AuditInput): Promise<void> {
  const svc = createServiceClient();
  await svc.from("admin_audit_log").insert({
    actor_id: input.staff.userId,
    actor_role: input.staff.role,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    before_state: input.before ?? null,
    after_state: input.after ?? null,
    ip: input.ip ?? null,
    metadata: input.metadata ?? {},
  });
}

/** Extract client IP from a request (best-effort behind proxies). */
export function clientIp(req: Request): string | null {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    null
  );
}
