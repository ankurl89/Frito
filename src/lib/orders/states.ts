/**
 * Canonical order state model — the single source of truth for the order
 * lifecycle. Shared by client and server (no server-only imports).
 *
 * Provider-specific vocabularies (Qikink "In Production", Printrove "printing")
 * are normalised onto these states by each provider adapter — they never leak
 * into the core.
 */

export const ORDER_STATES = [
  "pending_payment",
  "paid",
  "fulfillment_pending",
  "submitted_to_provider",
  "in_production",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "failed",
  "refunded",
] as const;

export type OrderState = (typeof ORDER_STATES)[number];

/**
 * Legal forward transitions. Anything not listed is rejected by the state
 * machine (in strict mode) or skipped (for out-of-order provider webhooks).
 */
export const TRANSITIONS: Record<OrderState, OrderState[]> = {
  pending_payment:       ["paid", "cancelled", "failed"],
  paid:                  ["fulfillment_pending", "refunded", "cancelled"],
  fulfillment_pending:   ["submitted_to_provider", "failed", "cancelled"],
  submitted_to_provider: ["in_production", "failed", "cancelled"],
  in_production:         ["packed", "cancelled", "failed"],
  packed:                ["shipped", "cancelled"],
  shipped:               ["delivered"],
  delivered:             ["refunded"],
  cancelled:             [],   // terminal
  failed:                ["fulfillment_pending", "cancelled"],  // retry path
  refunded:              [],   // terminal
};

export function canTransition(from: OrderState, to: OrderState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export const TERMINAL_STATES: OrderState[] = ["delivered", "cancelled", "refunded"];

export function isTerminal(state: OrderState): boolean {
  return TERMINAL_STATES.includes(state);
}

/**
 * Customer-facing pipeline. Internal states collapse into 5 stages so the
 * shopper never sees "submitted_to_provider" or any provider detail.
 */
export const CUSTOMER_STAGES = [
  { key: "received",   label: "Order Received" },
  { key: "production", label: "In Production" },
  { key: "packed",     label: "Packed" },
  { key: "shipped",    label: "Shipped" },
  { key: "delivered",  label: "Delivered" },
] as const;

const STATE_TO_STAGE: Record<OrderState, number> = {
  pending_payment: 0,
  paid: 0,
  fulfillment_pending: 0,
  submitted_to_provider: 0,
  in_production: 1,
  packed: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
  failed: 0,
  refunded: -1,
};

export function customerStageIndex(state: string): number {
  return STATE_TO_STAGE[state as OrderState] ?? 0;
}

/** Merchant-facing status badge metadata. */
export const ORDER_STATUS_META: Record<string, { label: string; cls: string }> = {
  pending_payment:       { label: "PENDING PAYMENT",  cls: "border-zinc-300 text-zinc-500 bg-zinc-50" },
  paid:                  { label: "PAID",             cls: "border-blue-300 text-blue-600 bg-blue-50" },
  fulfillment_pending:   { label: "FULFILLING",       cls: "border-blue-300 text-blue-600 bg-blue-50" },
  submitted_to_provider: { label: "SUBMITTED",        cls: "border-indigo-300 text-indigo-600 bg-indigo-50" },
  in_production:         { label: "IN PRODUCTION",    cls: "border-violet-300 text-violet-600 bg-violet-50" },
  packed:                { label: "PACKED",           cls: "border-amber-300 text-amber-700 bg-amber-50" },
  shipped:               { label: "SHIPPED",          cls: "border-amber-300 text-amber-700 bg-amber-50" },
  delivered:             { label: "DELIVERED",        cls: "border-green-300 text-green-700 bg-green-50" },
  cancelled:             { label: "CANCELLED",        cls: "border-red-300 text-red-600 bg-red-50" },
  failed:                { label: "FAILED",           cls: "border-red-300 text-red-600 bg-red-50" },
  refunded:              { label: "REFUNDED",         cls: "border-zinc-300 text-zinc-500 bg-zinc-50" },
};
