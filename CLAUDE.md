# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Next.js 16 warning:** This project uses Next.js 16 (Turbopack). APIs and conventions differ from earlier versions — in particular, `middleware.ts` has been renamed to `proxy.ts` and must export a `proxy` function (not `middleware`). Read deprecation notices carefully before writing code.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
npx tsc --noEmit # Type-check without emitting (run before committing)
```

There are no tests. Type-checking (`npx tsc --noEmit`) is the primary correctness gate.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=         # https://openrouter.ai — used for ALL AI calls
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Architecture

### What this is

Frito AI is a D2C brand-building platform. A user signs up, chats with an AI co-founder to create a **Brand DNA** object, then adds products from a Qikink print-on-demand catalog. AI generates SVG product designs. Orders automatically route to Qikink for fulfillment.

### Core data model

`BrandDNA` (in `src/lib/types.ts`) is the central object everything derives from:
- `palette` (ColorPalette) — drives logo, design, and listing generation
- `niche`, `target_audience`, `voice_tone`, `brand_values` — drive AI prompt context
- `price_tier` — drives suggested sell prices via `suggestSellPrice()` in `src/lib/qikink-catalog.ts`

All AI generation routes receive the full `BrandDNA` as context, not just a name or niche.

### AI pipeline

All LLM calls go through **OpenRouter** via `src/lib/openrouter.ts`, which wraps the OpenAI SDK with `baseURL: "https://openrouter.ai/api/v1"`. OpenRouter does NOT support image generation — `openrouter.images.generate()` will 404.

Models:
- `MODELS.fast` — `anthropic/claude-haiku-4-5` (listings, quick tasks)
- `MODELS.smart` — `anthropic/claude-sonnet-4-5` (brand creation, design generation)

Image/logo generation uses **SVG via Claude** (`MODELS.smart`), not an image API. The routes in `src/app/api/ai/logo/route.ts` and `src/app/api/ai/design/route.ts` prompt Claude to output raw SVG, extract it with a regex, and return a base64 data URI (`data:image/svg+xml;base64,...`).

The design route uses a **two-pass approach**:
1. Creative director pass — Claude decides *what* to design given full brand context
2. SVG execution pass — Claude builds the actual SVG using that concept

### Route protection

`src/proxy.ts` (Next.js 16's replacement for `middleware.ts`) guards routes:
- `/dashboard/*` and `/onboarding` → redirect to `/login` if unauthenticated
- `/login` and `/signup` → redirect to `/dashboard` if already authenticated
- `/api/webhooks/*` is excluded from the matcher (public webhook endpoint)

### Supabase setup

Two clients: `src/lib/supabase/client.ts` (browser, `createBrowserClient`) and `src/lib/supabase/server.ts` (server components/routes, `createServerClient` with cookies). Always use the server client in API routes and Server Components.

Schema is in `supabase-schema.sql`. Tables: `brands`, `products`, `orders`, `profiles`. All tables have Row Level Security — users can only access their own data. The `handle_new_user` trigger auto-creates a `profiles` row on signup.

### Product catalog

`src/lib/qikink-catalog.ts` contains a static array of 10 Qikink products with base prices in INR. This is a curated mock — in production it should be fetched live from Qikink's API. Products have `qikink_product_id` (e.g. `"QK-001"`) that maps to Qikink's catalog.

`suggestSellPrice(baseCost, priceTier)` applies a multiplier (2.0x–4.5x depending on tier) and rounds to the nearest ₹50.

### SKU generation

`src/app/api/products/route.ts` generates SKUs on product creation using the first 4 chars of `brand_id` + a 6-char random string from `src/lib/nanoid.ts`.

### Qikink fulfillment webhook

`src/app/api/webhooks/qikink/route.ts` receives POST webhooks from Qikink when order status changes. Register the public URL `https://yourdomain.com/api/webhooks/qikink` in the Qikink dashboard. The webhook maps Qikink status strings to internal `OrderStatus` enum values and updates the `orders` table.

## Design system

All internal pages follow the same visual style as the landing page:

- **Background:** `bg-[#F5F5F0]` off-white on page backgrounds
- **Sidebar:** `bg-zinc-900` dark, white type
- **Section labels:** `font-mono text-[10px] tracking-widest uppercase text-zinc-400` — always prefix content sections with these
- **Headings:** `font-black tracking-tight` — bold, tight
- **Status badges:** `font-mono text-[9px] tracking-wider border rounded px-2 py-0.5` — no filled background blobs
- **Product pricing:** always show Cost / Sell / Profit as three cells (last cell `bg-zinc-900 text-white`)
- **Accent colors:** violet-600 for CTAs, yellow-300 for profit/highlight stats
- **Inputs:** `bg-zinc-50 border border-zinc-200 rounded-xl` with `focus:ring-2 focus:ring-violet-500`
- **Buttons:** `bg-zinc-900 text-white` primary, `bg-violet-600 text-white` for brand actions

The landing page (`src/app/page.tsx`) is the reference for this style. A scheduled task (`frito-lovable-design-sync`) runs daily at 9 AM to sync visual improvements from the reference design at `https://brand-launch-ai-co.lovable.app`.

## Key non-obvious decisions

- **No Shopify for MVP.** The platform hosts its own storefront. Shopify export is a future premium feature.
- **No n8n.** Background jobs that would normally go through workflow automation are handled directly in API routes or via Inngest (not yet wired up — currently synchronous).
- **No Fabric.js.** Design editing is AI-only (describe → generate → approve). There is no canvas editor.
- **Email confirmation is disabled** in Supabase (`mailer_autoconfirm: true`) so signups work immediately without email verification.
- **Supabase project:** `pecaekbgmbuhssrwtclx` (region: `ap-south-1`, Mumbai).
