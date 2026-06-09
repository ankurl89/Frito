/**
 * Staff authentication + authorization for Mission Control.
 *
 * Pattern: verify the staff identity via the USER session (RLS-respecting),
 * then hand back the role. Pages/APIs that need cross-tenant data use the
 * service client AFTER this check passes — staff are trusted to see all
 * merchants once their role is verified.
 */

import { createClient } from "@/lib/supabase/server";
import { StaffRole, Permission, hasPermission } from "./rbac";

export interface StaffContext {
  userId: string;
  email: string | null;
  role: StaffRole;
  displayName: string | null;
}

/** Returns the staff context for the current session, or null if not staff. */
export async function getStaff(): Promise<StaffContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: staff } = await supabase
    .from("staff_users")
    .select("role, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!staff) return null;

  return {
    userId: user.id,
    email: user.email ?? null,
    role: staff.role as StaffRole,
    displayName: staff.display_name ?? null,
  };
}

/** Throws-style guard for API routes. Returns staff or a 401/403 reason. */
export async function requirePermission(
  perm: Permission
): Promise<{ ok: true; staff: StaffContext } | { ok: false; status: number; error: string }> {
  const staff = await getStaff();
  if (!staff) return { ok: false, status: 401, error: "Not a staff user" };
  if (!hasPermission(staff.role, perm)) {
    return { ok: false, status: 403, error: `Role '${staff.role}' lacks permission '${perm}'` };
  }
  return { ok: true, staff };
}
