/**
 * Color utilities — pure functions, safe on server or client.
 *
 * Used by the storefront layout to compute readable foreground colors for
 * each brand palette token. Brands with light primaries (e.g. cream) get
 * dark text on their primary surfaces; brands with dark primaries get light text.
 */

/** Parse hex like "#7c3aed" or "7c3aed" → {r, g, b}. Returns null on bad input. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  const clean = hex.replace("#", "").trim();
  if (clean.length !== 3 && clean.length !== 6) return null;
  const full = clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

/** Relative luminance per WCAG. Returns 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/** Pick a readable foreground (text) color for a given background hex. */
export function readableForeground(hex: string, darkText = "#0a0a0a", lightText = "#ffffff"): string {
  return luminance(hex) > 0.55 ? darkText : lightText;
}

/** WCAG contrast ratio between two colors (1 = identical, 21 = black/white). */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Return `text` if it reads acceptably on `bg`, otherwise a guaranteed-readable
 * fallback. Stops invisible white-on-white / low-contrast brand palettes.
 */
export function ensureReadable(text: string, bg: string, minRatio = 3): string {
  return contrastRatio(text, bg) >= minRatio ? text : readableForeground(bg);
}
