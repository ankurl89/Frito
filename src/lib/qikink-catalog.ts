/**
 * Supplier Product Catalog — V1: PREMIUM APPAREL ONLY.
 *
 * Constrained per V1_COMMERCE_RULES.md / src/lib/v1-commerce.ts:
 *   4 products · 4 colors · 4 template-driven print placements.
 *
 * Each product is a digital twin with FRONT + BACK template photos. Placements
 * map to predefined print areas on the relevant view — no arbitrary coordinates.
 */

import { ColorName, PlacementKey, PLACEMENTS, DEFAULT_PLACEMENT } from "./v1-commerce";

const TPL = "https://pecaekbgmbuhssrwtclx.supabase.co/storage/v1/object/public/product-assets/_templates";

export interface PrintArea {
  x: number; y: number; w: number; h: number;   // normalised (0–1) on the view template
  print_px_width: number; print_px_height: number;
}

export interface ProductView {
  url: string;      // full template (garment on studio background + drop shadow)
  cutout: string;   // background-removed garment (transparent) — used to recolor
}

export interface PlacementDef {
  key: PlacementKey;
  label: string;
  view: "front" | "back";
  print_area: PrintArea;
}

export interface ProductTemplate {
  id: string;
  name: string;
  category: "Apparel";
  base_price: number;            // INR
  material: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  popularity: "High" | "Medium" | "Low";
  margin_pct: number;            // typical margin at suggested price
  production_days: string;       // e.g. "3–5 days"
  available_sizes: string[];
  available_colors: ColorName[];
  views: { front: ProductView; back: ProductView };
  placements: PlacementDef[];
}

// All four V1 colors are stocked on every chosen Qikink garment.
//
// base_price = the founder-facing PRODUCTION COST per unit (INR):
//   supplier garment cost + DTG print + Frito's platform margin.
// Founder profit = sell_price − base_price; Frito's per-unit take =
// base_price − what the supplier actually bills us. Customer-paid shipping
// (₹49 at checkout) approximately offsets the courier charge.
//
// Cost model (supplier print cost is an ESTIMATE until trued up against the
// first live supplier invoice — see TODO.md):
//   QK-001 Oversized Tee : 265 garment + ~120 print + 64 margin = 449
//   QK-011 Supima Tee    : 300 garment + ~120 print + 79 margin = 499
//   QK-002 Hoodie        : 490 garment + ~130 print + 79 margin = 699
//   QK-012 Sweatshirt    : 390 garment + ~130 print + 79 margin = 599
const COLORS_ALL: ColorName[] = ["Black", "White", "Navy", "Maroon"];

// Reusable placement sets (normalised on the square 1024 templates).
function teePlacements(): PlacementDef[] {
  return [
    { key: "front_center", label: "Front Center", view: "front", print_area: { x: 0.36, y: 0.30, w: 0.28, h: 0.32, print_px_width: 3600, print_px_height: 4200 } },
    { key: "front_pocket", label: "Front Pocket", view: "front", print_area: { x: 0.40, y: 0.31, w: 0.13, h: 0.11, print_px_width: 1200, print_px_height: 1200 } },
    { key: "back_center",  label: "Back Center",  view: "back",  print_area: { x: 0.34, y: 0.24, w: 0.32, h: 0.30, print_px_width: 3600, print_px_height: 4200 } },
    { key: "full_back",    label: "Full Back",    view: "back",  print_area: { x: 0.29, y: 0.20, w: 0.42, h: 0.52, print_px_width: 3600, print_px_height: 4800 } },
  ];
}
function heavyPlacements(frontY: number, frontH: number): PlacementDef[] {
  // hoodie / sweatshirt — print sits a bit lower on the front
  return [
    { key: "front_center", label: "Front Center", view: "front", print_area: { x: 0.36, y: frontY, w: 0.28, h: frontH, print_px_width: 3600, print_px_height: 3600 } },
    { key: "front_pocket", label: "Front Pocket", view: "front", print_area: { x: 0.41, y: 0.40, w: 0.12, h: 0.10, print_px_width: 1200, print_px_height: 1200 } },
    { key: "back_center",  label: "Back Center",  view: "back",  print_area: { x: 0.34, y: 0.26, w: 0.32, h: 0.30, print_px_width: 3600, print_px_height: 4200 } },
    { key: "full_back",    label: "Full Back",    view: "back",  print_area: { x: 0.29, y: 0.22, w: 0.42, h: 0.50, print_px_width: 3600, print_px_height: 4800 } },
  ];
}

export const QIKINK_CATALOG: ProductTemplate[] = [
  {
    id: "QK-001",
    name: "Oversized T-Shirt",
    category: "Apparel",
    base_price: 449,
    material: "240 GSM combed cotton",
    description: "Heavyweight oversized fit. Drop shoulder. Pre-shrunk.",
    difficulty: "Easy", popularity: "High", margin_pct: 70, production_days: "3–5 days",
    available_sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    available_colors: COLORS_ALL,
    views: {
      front: { url: `${TPL}/tshirt.png`, cutout: `${TPL}/tshirt-cut.png` },
      back: { url: `${TPL}/tshirt-back.png`, cutout: `${TPL}/tshirt-back-cut.png` },
    },
    placements: teePlacements(),
  },
  {
    id: "QK-011",
    name: "Classic Unisex T-Shirt",
    category: "Apparel",
    base_price: 499,
    material: "Premium Supima cotton",
    description: "Regular unisex fit in premium Supima cotton. The easiest first product.",
    difficulty: "Easy", popularity: "High", margin_pct: 72, production_days: "3–5 days",
    available_sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    available_colors: COLORS_ALL,
    views: {
      front: { url: `${TPL}/tshirt.png`, cutout: `${TPL}/tshirt-cut.png` },
      back: { url: `${TPL}/tshirt-back.png`, cutout: `${TPL}/tshirt-back-cut.png` },
    },
    placements: teePlacements(),
  },
  {
    id: "QK-002",
    name: "Hoodie",
    category: "Apparel",
    base_price: 699,
    material: "320 GSM fleece-lined cotton blend",
    description: "Premium pullover hoodie. Kangaroo pocket. Heavyweight fleece.",
    difficulty: "Medium", popularity: "High", margin_pct: 65, production_days: "4–6 days",
    available_sizes: ["S", "M", "L", "XL", "XXL"],
    available_colors: COLORS_ALL,
    views: {
      front: { url: `${TPL}/hoodie.png`, cutout: `${TPL}/hoodie-cut.png` },
      back: { url: `${TPL}/hoodie-back.png`, cutout: `${TPL}/hoodie-back-cut.png` },
    },
    placements: heavyPlacements(0.40, 0.19),
  },
  {
    id: "QK-012",
    name: "Sweatshirt",
    category: "Apparel",
    base_price: 599,
    material: "300 GSM fleece-lined cotton blend",
    description: "Classic crewneck sweatshirt. Cozy, structured, premium feel.",
    difficulty: "Medium", popularity: "Medium", margin_pct: 66, production_days: "4–6 days",
    available_sizes: ["S", "M", "L", "XL", "XXL"],
    available_colors: COLORS_ALL,
    views: {
      front: { url: `${TPL}/sweatshirt.png`, cutout: `${TPL}/sweatshirt-cut.png` },
      back: { url: `${TPL}/sweatshirt-back.png`, cutout: `${TPL}/sweatshirt-back-cut.png` },
    },
    placements: heavyPlacements(0.40, 0.24),
  },
];

export const CATEGORIES = ["Apparel"];

export function getTemplate(id: string): ProductTemplate | undefined {
  return QIKINK_CATALOG.find(p => p.id === id);
}

/** Resolve a placement on a product, falling back to the default. */
export function getPlacement(template: ProductTemplate, key?: string): PlacementDef {
  return template.placements.find(p => p.key === key)
    || template.placements.find(p => p.key === DEFAULT_PLACEMENT)
    || template.placements[0];
}

/** The view template URL + cutout + print area for a chosen placement. */
export function placementTarget(template: ProductTemplate, key?: string): { url: string; cutout: string; printArea: PrintArea; placement: PlacementDef } {
  const placement = getPlacement(template, key);
  const view = template.views[placement.view];
  return { url: view.url, cutout: view.cutout, printArea: placement.print_area, placement };
}

export function suggestSellPrice(baseCost: number, priceTier: string): number {
  // Calibrated for ALL-IN base costs (garment + print + platform margin) —
  // e.g. premium tee 449 → ₹1,150, hoodie 699 → ₹1,800; keeps suggestions in
  // the ranges the Founder Playbook teaches.
  const m: Record<string, number> = { budget: 1.8, mid: 2.2, premium: 2.6, luxury: 3.2 };
  const mult = m[priceTier] || 2.2;
  return Math.ceil((baseCost * mult) / 50) * 50;
}

export { PLACEMENTS };
