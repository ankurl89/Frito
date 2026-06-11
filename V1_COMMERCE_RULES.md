# V1 Commerce Rules

**Frito V1 = "Launch a premium apparel brand in minutes."**
Not "create any product imaginable." We optimize for launch speed, fulfillment
reliability, image accuracy, and first-sale velocity — not catalog breadth.

> The enforceable source of truth is **`src/lib/v1-commerce.ts`**. This file is the
> human-readable mirror. Every AI agent, onboarding flow, product generator,
> dashboard, and storefront service imports from the code config. Keep both in sync.

## Supported products (4)

| Product | Catalog ID | Fit |
|---|---|---|
| Oversized T-Shirt | `QK-001` | Drop-shoulder, heavyweight |
| Classic Unisex T-Shirt | `QK-011` | Regular fit |
| Hoodie | `QK-002` | Pullover, fleece-lined |
| Sweatshirt | `QK-012` | Crewneck |

## Supported colors (4)

Black · White · Beige · Navy

Unlimited color options are intentionally **not** exposed — this improves
inventory, mockup consistency, supplier reliability, and AI rendering accuracy.

Each product is offered in one or more of these colors (the founder picks which).
Mockups are recolored server-side and in the live preview by multiply-tinting a
background-removed garment cutout (`_templates/<name>-cut.png`) over the original
template, so folds, shadows, and the studio background are preserved. The buyer
chooses color + size on the storefront; the order line item records both.

## Print placements (4 presets + fine-tune)

Front Center · Back Center · Front Pocket · Full Back

Each placement maps to a predefined print area on the garment's front or back
template — a one-click, print-safe starting point. The founder can then
**fine-tune** size (scale) and position (X/Y nudge) within the preview. The
chosen `{ key, scale, offset_x, offset_y }` is stored on the product and applied
identically by the Sharp renderer. No free drag-and-drop / arbitrary coordinates.

## Enforcement points

- **AI prompts** inject `AI_CONSTRAINTS` (design, listing, brand-book, onboard) →
  agents never recommend or design non-apparel.
- **Catalog** (`qikink-catalog.ts`) contains only the 4 products, each with front +
  back templates and the placement print areas.
- **Onboarding** uses `V1_NICHES` (apparel-relevant) and a 4-product picker.
- **Product creation** is "Create Apparel Product" with a placement selector.
- **Storefront / dashboard** derive from the constrained catalog automatically.

## Future-proofing (V2)

Expansion is config-only:
1. Flip the category flag in `CATEGORY_FLAGS` (e.g. `Accessories: true`).
2. Add catalog entries + templates.
3. Add the product IDs to `SUPPORTED_PRODUCT_IDS`.

Candidate V2 products: Tote Bags, Posters, Mugs, Phone Cases, additional apparel.
**None are enabled in V1.**

## Deferred (documented honestly, not built in this pass)

- **Multi-angle renders** beyond front/back/close-up (45°, lifestyle, size-guide,
  packaging) — need multi-view supplier templates we don't yet have.
- **Apparel analytics** (top color, top placement, top design) — order line items
  now capture color + size (`orders.variant`), but the analytics views that
  aggregate them are not yet built.
- **Mission Control inventory-by-color/size** — POD has no held inventory.
