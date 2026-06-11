/**
 * V1 COMMERCE RULES — the single source of truth for the constrained V1 catalog.
 *
 * Frito V1 = "Launch a premium apparel brand in minutes." NOT "create anything."
 * Every AI agent, onboarding flow, product generator, dashboard, and storefront
 * service imports from here. The human-readable companion is V1_COMMERCE_RULES.md
 * (keep them in sync).
 *
 * Expanding to V2 = flip a feature flag + add catalog entries. No rewrites.
 */

/* ── Colors ─────────────────────────────────────────────── */
// V1 colors are constrained to what Qikink stocks across ALL four garments.
// Beige was dropped (Qikink has no Beige hoodie/sweatshirt); Maroon is the
// universal premium 4th color.
export type ColorName = "Black" | "White" | "Navy" | "Maroon";

export const SUPPORTED_COLORS: { name: ColorName; hex: string }[] = [
  { name: "Black",  hex: "#1a1a1a" },
  { name: "White",  hex: "#f5f5f0" },
  { name: "Navy",   hex: "#1e2a44" },
  { name: "Maroon", hex: "#6b2737" },
];

export const SUPPORTED_COLOR_NAMES = SUPPORTED_COLORS.map(c => c.name);

export const DEFAULT_COLOR: ColorName = "White";

/** Hex for a color name (falls back to White). */
export function colorHex(name?: string): string {
  return SUPPORTED_COLORS.find(c => c.name === name)?.hex ?? "#f5f5f0";
}

/* ── Print placements (template-driven; no arbitrary coordinates) ── */
export type PlacementKey = "front_center" | "back_center" | "front_pocket" | "full_back";

export const PLACEMENTS: { key: PlacementKey; label: string; view: "front" | "back" }[] = [
  { key: "front_center", label: "Front Center", view: "front" },
  { key: "front_pocket", label: "Front Pocket", view: "front" },
  { key: "back_center",  label: "Back Center",  view: "back" },
  { key: "full_back",    label: "Full Back",    view: "back" },
];

export const DEFAULT_PLACEMENT: PlacementKey = "front_center";

/* ── Products ───────────────────────────────────────────── */
export const SUPPORTED_PRODUCT_IDS = ["QK-001", "QK-011", "QK-002", "QK-012"] as const;
export type SupportedProductId = (typeof SUPPORTED_PRODUCT_IDS)[number];

/* ── Category feature flags (V2 = flip to true + add catalog entries) ── */
export const CATEGORY_FLAGS: Record<string, boolean> = {
  Apparel: true,
  Drinkware: false,
  Accessories: false,
  "Home Decor": false,
  Stationery: false,
};

export function isCategoryEnabled(category: string): boolean {
  return CATEGORY_FLAGS[category] === true;
}
export function isProductEnabled(id: string): boolean {
  return (SUPPORTED_PRODUCT_IDS as readonly string[]).includes(id);
}
export function isColorEnabled(name: string): boolean {
  return SUPPORTED_COLOR_NAMES.includes(name as ColorName);
}

/**
 * The constraint block injected into EVERY AI prompt. This is how the rules are
 * enforced on generation — agents are told exactly what exists and what to never
 * produce.
 */
export const AI_CONSTRAINTS = `
FRITO V1 PRODUCT CONSTRAINTS (strict):
- This is a PREMIUM APPAREL platform. Only these products exist: Oversized T-Shirt, Classic Unisex T-Shirt, Hoodie, Sweatshirt.
- Available colors: Black, White, Navy, Maroon.
- Print placements: Front Center, Back Center, Front Pocket, Full Back.
- NEVER recommend, design for, or reference any non-apparel product (no phone cases, mugs, tote bags, posters, stickers, jewelry, footwear, drinkware, furniture, or children's products).
- All product recommendations must be one of the four apparel items above.
- All designs are artwork printed onto these garments — design accordingly.
`.trim();

/** Apparel-relevant brand niches for onboarding (no generic categories). */
export const V1_NICHES = [
  { key: "Anime", emoji: "⛩️", example: "Premium anime apparel, not childish fan merch" },
  { key: "Gaming", emoji: "🎮", example: "Apparel for a gaming community" },
  { key: "Fitness", emoji: "💪", example: "Apparel for people who train with intent" },
  { key: "Streetwear", emoji: "🧥", example: "Bold streetwear that turns heads" },
  { key: "Creator Merch", emoji: "🎬", example: "Drops for my audience" },
  { key: "Startup Merch", emoji: "🚀", example: "Branded apparel for my company" },
  { key: "Cause-Based", emoji: "🌍", example: "Apparel that stands for something" },
];
