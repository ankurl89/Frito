# Frito AI — Setup Guide

Follow these steps exactly to get the app running. No technical experience needed.

---

## Step 1: Create a Supabase account and project (free)

1. Go to **https://supabase.com** and click "Start your project"
2. Sign up with Google or email
3. Click **"New project"**
4. Fill in:
   - **Name**: Frito AI (or anything you like)
   - **Database Password**: choose a strong password and save it somewhere
   - **Region**: Asia South (Mumbai) — closest to India
5. Click **"Create new project"** and wait ~2 minutes for it to set up

---

## Step 2: Run the database schema

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase-schema.sql` from this project folder
4. Copy the entire contents and paste into the SQL editor
5. Click **"Run"** (green button)
6. You should see "Success. No rows returned"

---

## Step 3: Enable Google login (optional but recommended)

1. In Supabase, go to **Authentication → Providers**
2. Find **Google** and click to expand
3. Enable it
4. Follow the instructions to create a Google OAuth app (or skip this for now — email login works without it)

---

## Step 4: Get your Supabase API keys

1. In Supabase, go to **Settings → API** (in left sidebar)
2. You'll see:
   - **Project URL** — looks like `https://xxxxx.supabase.co`
   - **anon/public** key — a long string starting with `eyJ...`
   - **service_role** key — another long string (click the eye icon to reveal)
3. Keep this page open for Step 6

---

## Step 5: Get your OpenRouter API key

1. Go to **https://openrouter.ai** and sign up
2. Go to **Keys** in your account
3. Click **"Create Key"**, name it "Frito AI"
4. Copy the key (starts with `sk-or-...`)
5. Add some credits — $5 will handle hundreds of brand creations

---

## Step 6: Add your keys to the project

1. Open the file `.env.local` in this folder (C:\Users\minak\Frito New 0606)
2. Replace the placeholder values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...your anon key...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx...your service role key...
OPENROUTER_API_KEY=sk-or-v1-xxxxx...your openrouter key...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Save the file

---

## Step 7: Start the app

Open a terminal in this folder and run:

```
npm run dev
```

Then open your browser and go to: **http://localhost:3000**

---

## What you'll see

1. **Landing page** — the homepage of your platform
2. **Sign up** — create an account
3. **Onboarding chat** — talk to your AI co-founder to build your first brand
4. **Dashboard** — manage your brand, products, and orders

---

## The complete user flow

```
Sign up → Chat with AI co-founder (5–6 questions) → Brand DNA generated → Logo generated
→ Add products from catalog → AI designs them → Set pricing → Track orders
```

---

## When you're ready to go live (deploy to the internet)

1. Go to **https://vercel.com** and sign up with GitHub
2. Push this code to a GitHub repository
3. Import it into Vercel
4. Add all your `.env.local` values as Environment Variables in Vercel
5. Update `NEXT_PUBLIC_APP_URL` to your Vercel domain (e.g. `https://frito.vercel.app`)
6. Update the Supabase auth settings to allow your Vercel domain

---

## If you get errors

- **"Invalid API key"**: Check that your `.env.local` keys are correct (no spaces, no quotes)
- **"relation does not exist"**: The SQL schema hasn't been run yet (redo Step 2)
- **"Unauthorized"**: You're not logged in — go to `/signup` first
