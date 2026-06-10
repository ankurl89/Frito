/**
 * Plan limits — the guardrail config. Pure data, no imports.
 *
 * These protect the platform's wallet (Flux/OpenRouter spend) and enforce the
 * commercial plan tiers. Tune freely; they're read at request time.
 *
 *   aiPerMin     — burst cap on any AI call (stops tight loops / runaway clients)
 *   aiPerDay     — daily cap on text AI calls (brand, listing, book, onboard)
 *   aiImagePerDay— daily cap on IMAGE generation (Flux = real $/image)
 *   brands       — max brands the account may create
 *   productsPerDay — daily product-creation cap
 */

export type PlanName = "free" | "growth" | "scale";

export interface PlanLimits {
  aiPerMin: number;
  aiPerDay: number;
  aiImagePerDay: number;
  brands: number;
  productsPerDay: number;
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free:   { aiPerMin: 8,  aiPerDay: 50,   aiImagePerDay: 15,   brands: 1,        productsPerDay: 10 },
  growth: { aiPerMin: 20, aiPerDay: 500,  aiImagePerDay: 150,  brands: 3,        productsPerDay: 100 },
  scale:  { aiPerMin: 40, aiPerDay: 5000, aiImagePerDay: 1000, brands: 9999,     productsPerDay: 1000 },
};

export function limitsFor(plan: string | null | undefined): PlanLimits {
  return PLAN_LIMITS[(plan as PlanName) || "free"] || PLAN_LIMITS.free;
}
