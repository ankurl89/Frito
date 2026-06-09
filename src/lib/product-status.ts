/**
 * Status metadata for product lifecycle badges.
 * Kept in a separate file so client components can import it without
 * pulling in the server-only Supabase client.
 */

export const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft:     { label: "DRAFT",     cls: "border-zinc-300 text-zinc-500 bg-zinc-50" },
  published: { label: "PUBLISHED", cls: "border-green-300 text-green-700 bg-green-50" },
  active:    { label: "PUBLISHED", cls: "border-green-300 text-green-700 bg-green-50" }, // legacy
  archived:  { label: "ARCHIVED",  cls: "border-amber-300 text-amber-700 bg-amber-50" },
};
