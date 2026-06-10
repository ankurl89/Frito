# Deploying Frito to Vercel

The app builds clean (`npm run build` ✓) and is Vercel-ready. There are 4 phases.

---

## Phase 1 — Push the code to GitHub

Vercel deploys from a Git repo. Create one and push:

1. Go to **https://github.com/new** → create a repo (e.g. `frito`), **Private**, no README.
2. In the project folder, connect and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<you>/frito.git
   git push -u origin main
   ```
   (If prompted, sign in / use a GitHub personal access token as the password.)

`.env.local` is gitignored — your keys are NOT pushed. Good.

---

## Phase 2 — Import into Vercel

1. Go to **https://vercel.com/new** → sign in with GitHub.
2. **Import** the `frito` repo. Framework auto-detects as **Next.js**. Leave build settings default.
3. Before clicking Deploy, open **Environment Variables** and add everything from `.env.example`:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from Supabase → Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | from Supabase (keep secret) |
   | `OPENROUTER_API_KEY` | your OpenRouter key |
   | `WORKER_SECRET` | any long random string |
   | `FAL_KEY` | your fal.ai key |
   | `NEXT_PUBLIC_APP_URL` | **leave blank for now** — set in Phase 3 |

   (Add `QIKINK_*` / `FLUX_*` only when you have them.)
4. Click **Deploy**. First build takes ~2–3 min.

---

## Phase 3 — Wire the production URL

Once deployed you get a URL like `https://frito-xyz.vercel.app`.

1. **Vercel** → Settings → Environment Variables → set `NEXT_PUBLIC_APP_URL` to that URL → **Redeploy**.
2. **Supabase** → Authentication → URL Configuration → add to **Redirect URLs**:
   - `https://frito-xyz.vercel.app/auth/callback`
   - and set Site URL to `https://frito-xyz.vercel.app`

---

## Phase 4 — Turn on the fulfillment worker (durable retries)

In dev, a localhost ticker drains the job queue. In prod, schedule it with
Supabase `pg_cron` + `pg_net` (per-minute, independent of Vercel plan).

In **Supabase → SQL Editor**, run (replace the URL + secret):

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'drain-job-queue',
  '* * * * *',
  $$
  select net.http_post(
    url     := 'https://frito-xyz.vercel.app/api/jobs/worker',
    headers := jsonb_build_object('x-worker-secret', '<your WORKER_SECRET>')
  );
  $$
);
```

Verify: `select * from cron.job;` should list `drain-job-queue`.

---

## Notes / gotchas

- **Region**: `vercel.json` pins functions to **bom1 (Mumbai)** — closest to the Supabase `ap-south-1` DB, minimizing latency.
- **Function timeouts**: heavy AI routes export `maxDuration = 60`. On Vercel **Hobby** the cap is 60s; the Flux design route (generate → 4× upscale → bg-removal) can approach this. If you see timeouts, either upgrade to **Pro** (300s cap) or set `FLUX_UPSCALE=false`.
- **Storefront subdomains**: today storefronts are path-based (`/store/<slug>`). For `<brand>.tryfrito.com`, add a wildcard domain in Vercel + DNS and resolve the subdomain → slug in `proxy.ts`. (Deferred.)
- **Not yet wired** (see launch checklist): real Razorpay payments, Resend email, legal pages. Deploy first, then layer these on.
