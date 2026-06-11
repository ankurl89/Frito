/**
 * Qikink product mapping — the bridge between OUR catalog and Qikink's catalog.
 *
 * Qikink identifies a buyable variant by an SKU that encodes garment + color +
 * size, e.g. "MWGT-Wh-S". Our catalog uses internal ids (QK-001…) plus a color
 * name (Black/White/Beige/Navy) and a size. This module resolves
 *   (our productId, color, size) → Qikink SKU
 * plus the placement and print-type parameters a Qikink order line needs.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * HOW TO FILL THIS IN (one-time, from your Qikink dashboard):
 *   dashboard.qikink.com → Products / Catalogue → download the SKU sheet.
 *   You only need to fill the small code tables below:
 *     1. GARMENT_CODE   — Qikink's garment code for each of our 4 products
 *     2. COLOR_CODE     — Qikink's color code for each of our 4 colors
 *     3. SKU_FORMAT     — confirm the delimiter/order (default: CODE-COLOR-SIZE)
 *   For any variant whose SKU doesn't follow the pattern, add a one-off line to
 *   SKU_OVERRIDES and it wins.
 * Everything marked VERIFY should be checked against the sandbox in Phase 2.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { ColorName, PlacementKey } from "@/lib/v1-commerce";
import { SupportedProductId } from "@/lib/v1-commerce";

/** Qikink garment code per OUR product id. TODO: fill from the SKU sheet. */
const GARMENT_CODE: Record<string, string> = {
  "QK-001": "",   // Oversized T-Shirt        — VERIFY/fill (e.g. "MOdTs")
  "QK-011": "",   // Classic Unisex T-Shirt   — VERIFY/fill (e.g. "MRnTs")
  "QK-002": "",   // Hoodie                   — VERIFY/fill (e.g. "MHood")
  "QK-012": "",   // Sweatshirt               — VERIFY/fill (e.g. "MSwts")
};

/** Qikink color code per OUR color name. TODO: fill from the SKU sheet. */
const COLOR_CODE: Record<ColorName, string> = {
  Black: "",   // VERIFY/fill (e.g. "Bl")
  White: "",   // VERIFY/fill (e.g. "Wh")
  Beige: "",   // VERIFY/fill (e.g. "Be")
  Navy:  "",   // VERIFY/fill (e.g. "Nv")
};

/**
 * How Qikink assembles the SKU from the parts. Default assumes
 * `GARMENT-COLOR-SIZE`. Adjust if the sheet shows a different order/delimiter.
 */
function composeSku(garment: string, color: string, size: string): string {
  return `${garment}-${color}-${size}`;
}

/**
 * Exact-match overrides for variants that don't follow the pattern. Key is
 * `${productId}|${color}|${size}`. Anything here wins over composeSku.
 */
const SKU_OVERRIDES: Record<string, string> = {
  // "QK-002|Beige|XXL": "MHood-Be-2XL",
};

/**
 * Qikink `placement_sku` per OUR placement key. Qikink uses short codes; the API
 * docs confirm "fr" (front). "bk" (back), "lc" (left chest / pocket) follow
 * Qikink's standard scheme — VERIFY the pocket code against the dashboard, as
 * placement codes can vary per garment.
 */
const PLACEMENT_CODE: Record<PlacementKey, string> = {
  front_center: "fr",   // confirmed in API docs
  back_center:  "bk",   // VERIFY
  front_pocket: "lc",   // VERIFY (left-chest / pocket)
  full_back:    "bk",   // VERIFY (back position, full-size art)
};

/**
 * Qikink print_type_id per OUR product. DTG (direct-to-garment) suits cotton
 * tees; heavier fleece can use DTF. Defaults to DTG for all four.
 * VERIFY the numeric ids against Qikink (commonly DTG=1).
 */
const PRINT_TYPE_ID: Record<string, number> = {
  "QK-001": 1, // DTG  — VERIFY
  "QK-011": 1, // DTG  — VERIFY
  "QK-002": 1, // DTG  — VERIFY (consider DTF for fleece)
  "QK-012": 1, // DTG  — VERIFY
};

const DEFAULT_PRINT_TYPE_ID = 1;

/** True once the code tables have been populated (used to gate live submits). */
export function isQikinkCatalogMapped(): boolean {
  const garments = Object.values(GARMENT_CODE).every(Boolean);
  const colors = Object.values(COLOR_CODE).every(Boolean);
  return garments && colors;
}

/**
 * Resolve the Qikink SKU for one of our variants. Throws a descriptive error if
 * the combo isn't mapped — so we never submit a garbage SKU to a live order.
 */
export function resolveQikinkSku(productId: string, color: string, size: string): string {
  const override = SKU_OVERRIDES[`${productId}|${color}|${size}`];
  if (override) return override;

  const garment = GARMENT_CODE[productId];
  const colorCode = COLOR_CODE[color as ColorName];
  if (!garment) throw new Error(`No Qikink garment code mapped for product ${productId}`);
  if (!colorCode) throw new Error(`No Qikink color code mapped for color "${color}"`);
  if (!size) throw new Error(`Missing size for product ${productId}`);

  return composeSku(garment, colorCode, size);
}

export function resolveQikinkPlacement(key: PlacementKey | string | undefined): string {
  return PLACEMENT_CODE[(key as PlacementKey)] ?? PLACEMENT_CODE.front_center;
}

export function resolveQikinkPrintTypeId(productId: string): number {
  return PRINT_TYPE_ID[productId] ?? DEFAULT_PRINT_TYPE_ID;
}

export type { SupportedProductId };
