/**
 * Per-product Visualization Profiles.
 *
 * Every product type has a different definition of "good visualization":
 *   - a t-shirt print MUST be transparent and well-placed on the chest
 *   - a poster is full-bleed art where resolution/DPI dominates and
 *     transparency is irrelevant
 *   - a mug wrap cares less about coverage, more about clean resolution
 *
 * So both the PUBLISH THRESHOLD and the factor WEIGHTS differ per product.
 * Resolved by category, with optional per-product (SKU) override.
 *
 * Weights must sum to 100 so the score stays on a 0–100 scale.
 */

export interface VisualizationProfile {
  /** Minimum total score required to publish. */
  threshold: number;
  /** Max points per factor (must sum to 100). */
  weights: {
    resolution: number;     // RESOLUTION & DPI
    printReadiness: number; // PRINT READINESS (transparency, no errors)
    coverage: number;       // PLACEMENT COVERAGE
    brand: number;          // BRAND CONSISTENCY
    aspect: number;         // ASPECT & QUALITY
  };
  /** Apparel/fabric/die-cut need transparency; posters/mugs don't. */
  requireTransparency: boolean;
  /** Production DPI floor (posters demand more than apparel). */
  minDpi: number;
  /** Some products want the print to fill more of the area (poster ≫ polo). */
  minCoverage: number;
}

const CATEGORY_PROFILES: Record<string, VisualizationProfile> = {
  // Fabric chest prints — transparency + placement are critical.
  Apparel: {
    threshold: 85,
    weights: { resolution: 25, printReadiness: 30, coverage: 20, brand: 15, aspect: 10 },
    requireTransparency: true,
    minDpi: 150,
    minCoverage: 0.35,
  },
  // Wrap print — resolution clean, transparency optional, brand color pops.
  Drinkware: {
    threshold: 80,
    weights: { resolution: 30, printReadiness: 20, coverage: 20, brand: 20, aspect: 10 },
    requireTransparency: false,
    minDpi: 150,
    minCoverage: 0.30,
  },
  // Bags/cases/sleeves — mostly fabric, placement + transparency matter.
  Accessories: {
    threshold: 82,
    weights: { resolution: 25, printReadiness: 25, coverage: 25, brand: 15, aspect: 10 },
    requireTransparency: true,
    minDpi: 150,
    minCoverage: 0.35,
  },
  // Full-bleed art — DPI is everything, no transparency, high coverage.
  "Home Decor": {
    threshold: 80,
    weights: { resolution: 40, printReadiness: 15, coverage: 25, brand: 10, aspect: 10 },
    requireTransparency: false,
    minDpi: 200,
    minCoverage: 0.50,
  },
  // Die-cut stickers — transparency + clean edges (aspect) matter most.
  Stationery: {
    threshold: 80,
    weights: { resolution: 25, printReadiness: 30, coverage: 20, brand: 15, aspect: 10 },
    requireTransparency: true,
    minDpi: 150,
    minCoverage: 0.30,
  },
};

const DEFAULT_PROFILE: VisualizationProfile = {
  threshold: 82,
  weights: { resolution: 30, printReadiness: 25, coverage: 20, brand: 15, aspect: 10 },
  requireTransparency: true,
  minDpi: 150,
  minCoverage: 0.30,
};

/**
 * Per-SKU overrides for products whose needs differ from their category.
 * e.g. a phone case (Accessories) is a full-back print → wants high coverage
 * and doesn't strictly need transparency.
 */
const PRODUCT_OVERRIDES: Record<string, Partial<VisualizationProfile>> = {
  // V1 catalog (4 apparel products) uses the Apparel category profile directly.
  // Per-SKU overrides return here when a product's needs diverge from its category.
};

export function getVisualizationProfile(category: string, productId?: string): VisualizationProfile {
  const base = CATEGORY_PROFILES[category] || DEFAULT_PROFILE;
  const override = productId ? PRODUCT_OVERRIDES[productId] : undefined;
  if (!override) return base;
  return {
    ...base,
    ...override,
    weights: { ...base.weights, ...(override.weights || {}) },
  };
}
