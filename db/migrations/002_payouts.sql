-- Merchant earnings & payouts (Phase 1: ledger + payout details + manual runs).
--
-- payout_accounts : one row per founder — bank + PAN needed to pay them.
--                   SENSITIVE: RLS is enabled with NO policies, so only the
--                   service role (our API routes) can read/write. The app
--                   returns masked values to the browser.
-- payouts         : each payout made to a founder (recorded from Mission
--                   Control after the bank transfer; automated later).
--
-- The earnings ledger itself is DERIVED from orders.profit_amount (no extra
-- table to drift): earned = profit on revenue-status orders; available =
-- earned on orders older than the refund buffer minus payouts already made.
--
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).

create table if not exists payout_accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  account_holder  text not null,
  account_number  text not null,
  ifsc            text not null,
  pan             text not null,
  status          text not null default 'submitted',  -- submitted | verified | rejected
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists payouts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  amount      numeric not null check (amount > 0),
  status      text not null default 'paid',           -- paid | cancelled
  method      text not null default 'bank_transfer',
  reference   text,                                    -- UTR / bank reference
  notes       text,
  created_by  uuid,                                    -- staff user who recorded it
  created_at  timestamptz not null default now(),
  paid_at     timestamptz not null default now()
);

create index if not exists payouts_user_id_idx on payouts (user_id);

-- Lock both tables down: RLS on, no policies → service-role access only.
alter table payout_accounts enable row level security;
alter table payouts enable row level security;
