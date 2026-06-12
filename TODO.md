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

## Done
