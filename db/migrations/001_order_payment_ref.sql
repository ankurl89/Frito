-- Order ↔ payment reconciliation columns (Razorpay).
--
-- payment_order_ref : the Razorpay order id (order_...) — set when the payment
--                     is started, used by the webhook + browser callback to
--                     find the pre-created order and mark it paid.
-- payment_ref       : the Razorpay payment id (pay_...) — set on capture, used
--                     for refunds, support lookups, and reconciliation.
--
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).

alter table orders
  add column if not exists payment_order_ref text,
  add column if not exists payment_ref text;

-- The webhook/callback look orders up by the Razorpay order id.
create index if not exists orders_payment_order_ref_idx on orders (payment_order_ref);
