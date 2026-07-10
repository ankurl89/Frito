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
