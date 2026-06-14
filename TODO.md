# Frito — To-Do / Backlog

Running list of follow-ups that aren't blocking but shouldn't be lost.

## Open

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
