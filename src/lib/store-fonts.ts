/**
 * Curated web fonts for the storefront customizer. All are Google Fonts, so the
 * storefront can load them on demand and they actually render (not just a CSS
 * font-family string that silently falls back).
 *
 * Pure data + helpers — safe on server or client.
 */

export interface StoreFont {
  name: string;                 // Google Fonts family name
  category: "sans" | "serif" | "display";
}

export const STORE_FONTS: StoreFont[] = [
  { name: "Inter",              category: "sans" },
  { name: "Poppins",            category: "sans" },
  { name: "Montserrat",         category: "sans" },
  { name: "DM Sans",            category: "sans" },
  { name: "Manrope",            category: "sans" },
  { name: "Space Grotesk",      category: "sans" },
  { name: "Plus Jakarta Sans",  category: "sans" },
  { name: "Work Sans",          category: "sans" },
  { name: "Archivo",            category: "sans" },
  { name: "Sora",               category: "sans" },
  { name: "Oswald",             category: "display" },
  { name: "Bebas Neue",         category: "display" },
  { name: "Anton",              category: "display" },
  { name: "Playfair Display",   category: "serif" },
  { name: "DM Serif Display",   category: "serif" },
  { name: "Lora",               category: "serif" },
];

const SERIF = new Set(STORE_FONTS.filter(f => f.category === "serif").map(f => f.name));
const DISPLAY = new Set(STORE_FONTS.filter(f => f.category === "display").map(f => f.name));
const KNOWN = new Set(STORE_FONTS.map(f => f.name));

/**
 * Return the font name only if it's a curated, loadable family. Legacy brands
 * store a font *description* (e.g. "Bold geometric sans-serif") in typography —
 * that must NOT be used as a CSS family or a Google Fonts request.
 */
export function knownFont(name?: string | null): string | null {
  return name && KNOWN.has(name) ? name : null;
}

export const DEFAULT_HEADLINE_FONT = "Inter";
export const DEFAULT_BODY_FONT = "Inter";

/** A CSS font-family stack for a family name, with a sensible fallback. */
export function fontStack(name?: string | null): string {
  if (!name) return "Inter, system-ui, sans-serif";
  const fallback = SERIF.has(name) ? "serif" : DISPLAY.has(name) ? "sans-serif" : "system-ui, sans-serif";
  return `'${name}', ${fallback}`;
}

/** Build a Google Fonts stylesheet href that loads the given families. */
export function googleFontsHref(names: (string | null | undefined)[]): string | null {
  const families = [...new Set(names.filter((n): n is string => !!n))];
  if (families.length === 0) return null;
  const params = families
    .map(n => `family=${encodeURIComponent(n).replace(/%20/g, "+")}:wght@400;500;600;700;800;900`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
