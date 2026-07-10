/**
 * Size guides for the V1 apparel catalog. Measurements in inches, garment
 * laid flat — standard Indian POD specs for these garment classes. Marked
 * approximate in the UI (±0.5"). Keyed by our catalog product id.
 */

export interface SizeRow {
  size: string;
  chest: number;    // pit-to-pit × 2 equivalent (garment chest)
  length: number;   // shoulder to hem
}

const CLASSIC_FIT: SizeRow[] = [
  { size: "S",   chest: 38, length: 26 },
  { size: "M",   chest: 40, length: 27 },
  { size: "L",   chest: 42, length: 28 },
  { size: "XL",  chest: 44, length: 29 },
  { size: "XXL", chest: 46, length: 30 },
];

const OVERSIZED_FIT: SizeRow[] = [
  { size: "S",   chest: 44, length: 27 },
  { size: "M",   chest: 46, length: 28 },
  { size: "L",   chest: 48, length: 29 },
  { size: "XL",  chest: 50, length: 30 },
  { size: "XXL", chest: 52, length: 31 },
];

const FLEECE_FIT: SizeRow[] = [
  { size: "S",   chest: 40, length: 26 },
  { size: "M",   chest: 42, length: 27 },
  { size: "L",   chest: 44, length: 28 },
  { size: "XL",  chest: 46, length: 29 },
  { size: "XXL", chest: 48, length: 30 },
];

const CHARTS: Record<string, { rows: SizeRow[]; fitNote: string }> = {
  "QK-001": { rows: OVERSIZED_FIT, fitNote: "Relaxed oversized fit — for a regular fit, size down." },
  "QK-011": { rows: CLASSIC_FIT,   fitNote: "True to size, classic unisex fit." },
  "QK-002": { rows: FLEECE_FIT,    fitNote: "Regular fit with room for layering. Size up for a relaxed fit." },
  "QK-012": { rows: FLEECE_FIT,    fitNote: "Regular fit with room for layering. Size up for a relaxed fit." },
};

export function getSizeGuide(productId?: string | null): { rows: SizeRow[]; fitNote: string } {
  return CHARTS[productId || ""] || { rows: CLASSIC_FIT, fitNote: "True to size, classic unisex fit." };
}
