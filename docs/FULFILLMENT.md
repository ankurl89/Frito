# Fulfillment Core — Architecture

The order/fulfillment pipeline is provider-agnostic and durable. Nothing in the
platform talks to Qikink (or any provider) directly — only through adapters.

## Flow

```
Customer checkout
      │  POST /api/store/orders   (idempotency-key header)
      ▼
Order created as `paid`  ──► order_events (audit)
      │  state machine
      ▼
`fulfillment_pending`  ──► enqueue job_queue("fulfillment.submit")
      │  worker (kick now + pg_cron fallback)
      ▼
Fulfillment Engine ──► ProviderRegistry ──► QikinkAdapter.submitOrder()
      │                                       (sandbox if no creds)
      ▼
`submitted_to_provider`  + fulfillment_orders.provider_order_id stored
      │
      ├─ real provider:  webhook → adapter.normalizeWebhook → state machine
      └─ sandbox:        job_queue("order.simulate_advance") chain
      ▼
in_production → packed → shipped → delivered
```

## Order states (canonical)

`pending_payment → paid → fulfillment_pending → submitted_to_provider →
in_production → packed → shipped → delivered`
plus `cancelled`, `failed`, `refunded`. Defined once in
`src/lib/orders/states.ts`. Every transition is validated and writes an
append-only `order_events` row.

## Components

| Module | Responsibility |
|---|---|
| `lib/orders/states.ts` | Canonical states, transition table, customer-stage + badge mapping (shared client/server) |
| `lib/orders/state-machine.ts` | `transition()` — validates + audits. Only writer of `orders.status`. |
| `lib/fulfillment/types.ts` | `FulfillmentProvider` interface |
| `lib/fulfillment/adapters/*` | Qikink (real API + sandbox), Printrove (stub) |
| `lib/fulfillment/registry.ts` | Data-driven provider selection |
| `lib/fulfillment/engine.ts` | Submit / tracking-sync / sandbox progression orchestration |
| `lib/queue/job-queue.ts` | Postgres outbox: enqueue, claim (FOR UPDATE SKIP LOCKED), backoff, DLQ |
| `api/jobs/worker` | Drains queue; secret-protected |

## Reliability

- **Idempotent checkout**: `idempotency-key` header → `idempotency_keys` table replays the same response.
- **Idempotent submission**: job key `submit:{orderId}`; engine skips if `provider_order_id` already exists; provider gets `orderId` as its idempotency key.
- **Retry backoff**: 1m → 5m → 15m → 1h → 24h (`BACKOFF_SECONDS`), then **dead-letter** (`status='dead'`) with an escalation log hook.
- **Concurrency-safe**: `claim_job()` uses `FOR UPDATE SKIP LOCKED` so multiple worker invocations never double-process.

## Driving the worker

**Production** — enable pg_cron + pg_net in Supabase and schedule:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'drain-job-queue',
  '* * * * *',                       -- every minute
  $$
  select net.http_post(
    url     := 'https://YOUR_DEPLOYED_DOMAIN/api/jobs/worker',
    headers := jsonb_build_object('x-worker-secret', 'YOUR_WORKER_SECRET')
  );
  $$
);
```

The inline `kickWorker()` after each enqueue handles the happy path immediately;
cron drains retries and anything the kick missed.

**Local dev** — Supabase cloud can't reach `localhost`, so `DevWorkerTicker`
(mounted in the dashboard, localhost-only) pings `/api/jobs/tick` every 12s.
Inert in production.

## Adding a provider

1. Implement `FulfillmentProvider` in `lib/fulfillment/adapters/<name>.ts`.
2. Register it in `lib/fulfillment/registry.ts`.
3. Set `products.fulfillment_provider = '<name>'`.

No changes to the engine, queue, state machine, checkout, or webhooks.

## Deferred (interfaces ready, impl later)

- **Inventory**: POD is infinite-inventory; reservation ledger only needed for
  stocked manufacturing partners.
- **Pricing service**: cost/margin already computed per-order; a dedicated
  sync service lands when multi-provider cost feeds arrive.
- **Queue swap**: `JobQueue` surface is small enough to back with QStash/Inngest
  if volume outgrows Postgres.
