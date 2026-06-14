/**
 * Provider registry — the only place that knows which adapters exist.
 *
 * Selection is data-driven (product.fulfillment_provider), so onboarding a new
 * provider is: implement the adapter, register it here, set products to use it.
 * No branching anywhere else in the codebase.
 */

import { FulfillmentProvider } from "./types";
import { QikinkAdapter } from "./adapters/qikink";
import { PrintroveAdapter } from "./adapters/printrove";

const REGISTRY: Record<string, FulfillmentProvider> = {
  qikink: new QikinkAdapter(),
  printrove: new PrintroveAdapter(),
};

const DEFAULT_PROVIDER = "qikink";

export function getProvider(name?: string | null): FulfillmentProvider {
  const provider = REGISTRY[name || DEFAULT_PROVIDER];
  if (!provider) throw new Error(`Unknown fulfillment provider: ${name}`);
  return provider;
}

export function listProviders(): string[] {
  return Object.keys(REGISTRY);
}

/**
 * Neutral display label for a provider — keeps supplier identities out of the
 * UI (even staff-facing Mission Control) while staying distinguishable for ops.
 */
const PROVIDER_LABELS: Record<string, string> = {
  qikink: "Production Partner A",
  printrove: "Production Partner B",
};

export function providerLabel(name?: string | null): string {
  return PROVIDER_LABELS[name || ""] || "Production Partner";
}
