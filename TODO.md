# Frito — To-Do / Backlog

Running list of follow-ups that aren't blocking but shouldn't be lost.

## Open

- [ ] **Payouts — CA/legal review of the merchant-of-record structure (BLOCKS real merchant money).**
  Decision made (2026-06-26): Frito operates as **Merchant of Record** (Redbubble/Spring model) —
  Frito is the seller; founders earn a profit share paid from their earnings balance. Phase 1
  (derived earnings ledger + payout details w/ PAN + manual payouts desk in Mission Control) is BUILT.
  Before paying real money, a CA must review:
  1. GST treatment — as MoR, Frito invoices the full sale value, not just its fees.
  2. TDS on founder payouts — 194-O vs 194-R vs 194-H characterisation.
  3. Terms §5–6 wording (earnings/profit-share language drafted; needs professional sign-off).
  4. Payout cycle — currently "periodic"; decide weekly vs monthly + minimum threshold.
  Context: RBI PA Directions 2025 rule out holding seller funds without a licence (why MoR),
  and marketplace sellers of goods need GST regardless of turnover (why not Razorpay Route
  for hobbyist founders). Route remains an option for a future registered-business tier.

- [ ] **Payouts — Phase 3: automate transfers via a payout rail (e.g. RazorpayX)** once manual
  runs have validated the ledger. Requires migration `db/migrations/002_payouts.sql` to be applied.

- [ ] **Emails — set `RESEND_API_KEY` + `EMAIL_FROM` in Vercel** to activate the transactional
  emails (order confirmation, shipped w/ tracking, founder sale alert — built in `lib/email.ts` +
  `lib/notifications.ts`, no-op until the key exists). Needs a Resend account + verified domain.

- [ ] **COD (Cash on Delivery)** — deliberately deferred: needs its own order state
  (confirmed-unpaid), a Razorpay-bypass path in the payment gate, Qikink `gateway: "COD"` with
  collectable amount, and COD-risk rules (fake-order abuse). Big conversion lever for India —
  build as its own project.

- [ ] **Discount/coupon codes** — deferred: table + validation at payment-create + checkout field
  + founder UI. Four Playbook guides reference codes.

- [ ] **Product reviews** on storefronts — deferred (social proof).

- [ ] **Artwork quality: consider `FLUX_MODEL=fal-ai/flux/dev`** (higher quality than schnell,
  ~2× cost/latency) — one env var; test side-by-side before switching.

- [ ] **First live print check** — when the first real Qikink order goes out, verify the file
  Qikink received is the full-resolution production file (the bg-removal step's output resolution
  is unconfirmed) and that the printed size matches the mockup (width/height_inches now sent).

- [ ] **True-up the unit cost model against the first live Qikink invoice.** base_price now =
  garment + estimated DTG print + platform margin (449/499/699/599 — see the cost model comment
  in `src/lib/qikink-catalog.ts`). The print estimates (~₹120–130) and the ₹49 customer shipping
  vs real courier charge are ESTIMATES — verify both on the first real invoice and tune the four
  numbers in one place. Also decide whether the two legacy non-V1 test products (Tote Bags,
  QK-004/QK-010) should be archived.

- [ ] **Set up dedicated admin email accounts for Mission Control (separation of identity).**
  - Why: today `l.ankur89@gmail.com` is **both** a founder/storefront account **and** the
    super-admin. The staff login is separate, but the identity is shared. Using dedicated
    admin emails (e.g. `name@frito.com`) that are never storefront customers gives clean
    separation between the customer app and the super-admin dashboard.
  - Status: **email accounts not created yet** (waiting on the user).
  - Steps once emails exist:
    1. Create an account for each admin email (sign up at `/signup`, or provision via Supabase).
    2. Add each to the `staff_users` table with the right role
       (`super_admin`, `ops_manager`, `support_agent`, `finance_manager`, `growth_manager`, `read_only`).
    3. (Optional) Remove the personal/founder account (`l.ankur89@gmail.com`) from `staff_users`
       once a dedicated admin account is confirmed working — so the customer account is no
       longer also an admin. **Don't do this until a replacement super_admin can log in**, to
       avoid locking out of Mission Control.

- [ ] **Replace the upgrade-CTA email** (`/dashboard/upgrade`) — currently `ankur.rocks89@gmail.com`
  (personal, placeholder). Swap for a real support address when one exists.

- [ ] **Custom domains — finish infrastructure for `frito.ai`** (code + DB done and
  routing verified end-to-end; remaining is registrar/Vercel only — see `CUSTOM_DOMAINS.md`).
  1. In Vercel, add `frito.ai`, `www.frito.ai`, and the `*.frito.ai` wildcard to the project.
  2. Add DNS at the registrar: `*` CNAME → `cname.vercel-dns.com`; apex `@` A → `76.76.21.21`; `www` CNAME → `cname.vercel-dns.com`.
  3. Set `NEXT_PUBLIC_STORE_DOMAIN=frito.ai` in Vercel (Production) → redeploy.
  Then every store is live at `<slug>.frito.ai` and merchants can connect custom domains.

- [ ] **Custom domains — optional auto-provisioning.** Set `VERCEL_TOKEN` + `VERCEL_PROJECT_ID`
  and wire the Vercel "add domain" API into `/api/domains` so merchant custom domains are
  registered with Vercel automatically (today they're added manually in the Vercel dashboard).

## Done
