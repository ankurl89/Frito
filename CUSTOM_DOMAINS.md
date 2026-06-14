# Custom Domains & Branded Subdomains

Store base domain: **frito.ai** (set via `NEXT_PUBLIC_STORE_DOMAIN`).

Two ways a store can have its own address:

1. **Branded subdomain** — `oversized-anime.frito.ai`. Every store gets one
   automatically once the wildcard is set up. No per-store work.
2. **Custom domain** — `shop.merchantbrand.com`. The merchant connects their own
   domain from **Store Settings → Domain**.

The app routing for both is already built (`src/proxy.ts` + `src/lib/domains.ts`):
the middleware reads the incoming host and rewrites to `/store/<slug>`. What's
left is the one-time infrastructure below.

---

## What's already done (code + DB)

- Host → storefront routing in the middleware (subdomain + custom domain).
- `brands.custom_domain` + `brands.domain_status` columns (added).
- Store Settings → Domain UI: shows the branded subdomain and lets a merchant
  connect a custom domain (saves it + shows the DNS record to add).

---

## One-time setup (you) — for `frito.ai`

### Prerequisite
You own `frito.ai` and can edit its DNS at the registrar.

### Step 1 — Vercel domains
In the Vercel project (`frito` / frito-psi):

- Add the **apex** `frito.ai` (and `www.frito.ai`) for the marketing site + app.
- Add the **wildcard** `*.frito.ai` — this is what makes every
  `<slug>.frito.ai` resolve to the app. Vercel issues a wildcard SSL cert.
- (If you want the app to also keep responding on the old `frito-psi.vercel.app`,
  that keeps working automatically — `*.vercel.app` is always treated as the app.)

### Step 2 — DNS at your registrar (where frito.ai is registered)
- `*`   → **CNAME** → `cname.vercel-dns.com`   (wildcard subdomains — the key one)
- `@` (apex) → **A** → `76.76.21.21`            (apex → the platform)
- `www` → **CNAME** → `cname.vercel-dns.com`

### Step 3 — Env var
In Vercel → Settings → Environment Variables (Production):

```
NEXT_PUBLIC_STORE_DOMAIN = frito.ai
```

Redeploy. From now on every store is live at `<slug>.frito.ai`, the apex/www
serve the marketing site, and Store Settings shows each store's address.

---

## Custom domains (per merchant)

1. Merchant enters their domain in **Store Settings → Domain** → it's saved with
   status `pending` and the app shows the DNS record to add.
2. Merchant adds that record at their registrar
   (subdomain → CNAME `cname.vercel-dns.com`; apex → A `76.76.21.21`).
3. **The domain must be added to the Vercel project** so Vercel serves it and
   issues SSL. Two options:
   - **Manual:** add the domain in the Vercel dashboard (fine for a few stores).
   - **Automatic (recommended at scale):** set `VERCEL_TOKEN` + `VERCEL_PROJECT_ID`
     and the app will add/verify domains via the Vercel API. _This auto-provision
     layer is the remaining follow-up — the connect UI + DNS instructions work
     today; wiring the Vercel API call is a small next step._

Once DNS propagates and Vercel verifies, the store is live on the custom domain
(the middleware already routes it via `brands.custom_domain`).

---

## Notes
- With `NEXT_PUBLIC_STORE_DOMAIN` unset, the app falls back to path-based
  storefronts (`/store/<slug>`) — nothing breaks before setup.
- The middleware only does a DB lookup for genuine custom-domain hosts; app and
  subdomain requests are resolved from the host string alone (no DB hit).
