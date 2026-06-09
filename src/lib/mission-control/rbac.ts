/**
 * Mission Control RBAC — roles, permissions, and checks.
 *
 * Pure data + functions, no server imports. Enforced in two places:
 *   1. the /mission-control layout (page-level gate)
 *   2. every admin action API (per-action gate, before the privileged write)
 *
 * Principle: deny by default. A role only has the permissions explicitly listed.
 */

export type StaffRole =
  | "super_admin"
  | "ops_manager"
  | "support_agent"
  | "finance_manager"
  | "growth_manager"
  | "read_only";

export type Permission =
  // Executive
  | "view_executive"
  // Orders
  | "view_orders" | "retry_order" | "cancel_order" | "refund_order"
  // Fulfillment
  | "view_fulfillment" | "manage_provider" | "retry_job"
  // Merchants
  | "view_merchants" | "suspend_merchant" | "impersonate_merchant"
  // Customers
  | "view_customers"
  // Pricing / Inventory
  | "view_pricing" | "view_inventory"
  // Audit
  | "view_audit"
  // Staff admin
  | "manage_staff";

const ALL: Permission[] = [
  "view_executive",
  "view_orders", "retry_order", "cancel_order", "refund_order",
  "view_fulfillment", "manage_provider", "retry_job",
  "view_merchants", "suspend_merchant", "impersonate_merchant",
  "view_customers", "view_pricing", "view_inventory",
  "view_audit", "manage_staff",
];

export const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  super_admin: ALL,

  ops_manager: [
    "view_executive",
    "view_orders", "retry_order", "cancel_order",
    "view_fulfillment", "manage_provider", "retry_job",
    "view_merchants", "view_customers", "view_inventory", "view_audit",
  ],

  support_agent: [
    "view_orders", "refund_order",
    "view_merchants", "view_customers", "view_fulfillment",
  ],

  finance_manager: [
    "view_executive",
    "view_orders", "refund_order",
    "view_pricing", "view_merchants", "view_audit",
  ],

  growth_manager: [
    "view_executive", "view_merchants", "view_customers",
  ],

  read_only: [
    "view_executive", "view_orders", "view_fulfillment",
    "view_merchants", "view_customers", "view_pricing", "view_inventory", "view_audit",
  ],
};

export function hasPermission(role: StaffRole, perm: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}

export const ROLE_META: Record<StaffRole, { label: string; cls: string }> = {
  super_admin:     { label: "Super Admin",      cls: "bg-violet-500/20 text-violet-300 border-violet-500/40" },
  ops_manager:     { label: "Operations",       cls: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  support_agent:   { label: "Support",          cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  finance_manager: { label: "Finance",          cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  growth_manager:  { label: "Growth",           cls: "bg-pink-500/20 text-pink-300 border-pink-500/40" },
  read_only:       { label: "Read Only",        cls: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40" },
};
