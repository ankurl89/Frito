/**
 * Founder progression catalog — levels, achievements, XP rules.
 *
 * Single source of truth for the gamification system. Edit here and both
 * server (XP awards, achievement unlock checks) and client (display) update.
 *
 * No server imports — safe to use anywhere.
 */

/** ── Levels ─────────────────────────────────────────────────── */
export interface Level {
  level: number;
  name: string;
  min_xp: number;
}

export const LEVELS: Level[] = [
  { level: 1,  name: "Dreamer",       min_xp: 0 },
  { level: 2,  name: "Builder",       min_xp: 100 },
  { level: 3,  name: "Creator",       min_xp: 300 },
  { level: 4,  name: "Founder",       min_xp: 600 },
  { level: 5,  name: "Operator",      min_xp: 1000 },
  { level: 6,  name: "Entrepreneur",  min_xp: 1500 },
  { level: 7,  name: "Growth Hacker", min_xp: 2500 },
  { level: 8,  name: "Brand Owner",   min_xp: 4000 },
  { level: 9,  name: "Scale Up",      min_xp: 6000 },
  { level: 10, name: "CEO",           min_xp: 10000 },
];

export function levelForXP(xp: number): Level {
  let current = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.min_xp) current = l;
  return current;
}

export function nextLevel(xp: number): Level | null {
  return LEVELS.find(l => l.min_xp > xp) || null;
}

/** ── XP rules ──────────────────────────────────────────────── */
export const XP_RULES = {
  account_created: 50,
  brand_created:   100,
  product_created: 25,
  product_published: 100,
  brand_book_ready: 50,
  first_visitor:   50,
  order_received:  100,
  // Revenue milestones (one-time)
  revenue_1k:      250,
  revenue_10k:     500,
  revenue_50k:     750,
  revenue_1l:      1000,
  revenue_5l:      2000,
  revenue_10l:     5000,
} as const;

export type XPAction = keyof typeof XP_RULES;

/** ── Achievements ──────────────────────────────────────────── */
export interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: string;            // emoji
  category: "founder" | "product" | "sales" | "habit";
  /** Threshold-based unlocks: function returns true if achievement should fire. */
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  signed_up: {
    key: "signed_up", name: "Dreamer", icon: "✨",
    description: "Created your founder account",
    category: "founder",
  },
  first_brand: {
    key: "first_brand", name: "Brand Builder", icon: "🎨",
    description: "Created your first brand identity",
    category: "founder",
  },
  first_product: {
    key: "first_product", name: "Product Creator", icon: "📦",
    description: "Designed your first product",
    category: "product",
  },
  first_publish: {
    key: "first_publish", name: "Launch Day", icon: "🚀",
    description: "Published your first product to the storefront",
    category: "product",
  },
  catalog_5: {
    key: "catalog_5", name: "Range Starter", icon: "📚",
    description: "Published 5 products",
    category: "product",
  },
  catalog_25: {
    key: "catalog_25", name: "Catalog Master", icon: "👑",
    description: "Published 25 products",
    category: "product",
  },
  first_sale: {
    key: "first_sale", name: "First Sale", icon: "🎉",
    description: "Received your first paying customer",
    category: "sales",
  },
  revenue_1k: {
    key: "revenue_1k", name: "Revenue Hero", icon: "💰",
    description: "Crossed ₹1,000 in sales",
    category: "sales",
  },
  revenue_10k: {
    key: "revenue_10k", name: "Five-Figure Founder", icon: "💎",
    description: "Crossed ₹10,000 in sales",
    category: "sales",
  },
  revenue_1l: {
    key: "revenue_1l", name: "Six-Figure Brand", icon: "🏆",
    description: "Crossed ₹1 Lakh in sales",
    category: "sales",
  },
  streak_7: {
    key: "streak_7", name: "On Fire", icon: "🔥",
    description: "7-day founder streak",
    category: "habit",
  },
  streak_30: {
    key: "streak_30", name: "Unstoppable", icon: "⚡",
    description: "30-day founder streak",
    category: "habit",
  },
  night_owl: {
    key: "night_owl", name: "Night Owl", icon: "🦉",
    description: "Worked on your store after midnight",
    category: "habit",
  },
};

/** ── Launch progress checklist ─────────────────────────────── */
export interface LaunchStep {
  key: string;
  label: string;
  description: string;
}

export const LAUNCH_STEPS: LaunchStep[] = [
  { key: "brand_created",   label: "Create your brand",       description: "Brand name, story, voice, visual identity" },
  { key: "brand_book_ready", label: "Generate your Brand Book", description: "Full brand operating system" },
  { key: "product_created", label: "Add your first product",  description: "Pick template + add artwork" },
  { key: "product_published", label: "Publish a product",     description: "Make it live on your storefront" },
  { key: "first_order",     label: "Receive your first order", description: "Real customer, real revenue" },
];

/** ── Revenue milestone thresholds (INR) ────────────────────── */
export const REVENUE_MILESTONES = [
  { key: "revenue_1k",  threshold: 1_000,    label: "₹1,000",   xp: XP_RULES.revenue_1k },
  { key: "revenue_10k", threshold: 10_000,   label: "₹10,000",  xp: XP_RULES.revenue_10k },
  { key: "revenue_50k", threshold: 50_000,   label: "₹50,000",  xp: XP_RULES.revenue_50k },
  { key: "revenue_1l",  threshold: 100_000,  label: "₹1 Lakh",  xp: XP_RULES.revenue_1l },
  { key: "revenue_5l",  threshold: 500_000,  label: "₹5 Lakh",  xp: XP_RULES.revenue_5l },
  { key: "revenue_10l", threshold: 1_000_000, label: "₹10 Lakh", xp: XP_RULES.revenue_10l },
];
