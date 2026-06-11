# Qikink Integration — Status & Notes

_Last updated: 2026-06-11_

## ⏰ REMINDER — Live API (due ~2026-06-14)

Qikink will share **LIVE** API credentials around **2026-06-14** (3 days after
2026-06-11). When they arrive:

1. In Vercel (and `.env.local`) set the **live** `QIKINK_CLIENT_ID` /
   `QIKINK_CLIENT_SECRET`.
2. Set `QIKINK_BASE=https://api.qikink.com` (or leave blank — live is the default).
3. Confirm the SKU code tables in `src/lib/fulfillment/qikink-sku.ts` are filled.
4. Run one low-cost real smoke order and watch it flow to `delivered`.

## Where we are

| Piece | Status |
|---|---|
| Token exchange (ClientId+secret → access_token) | ✅ Built + **verified against sandbox** |
| Auth caching + 401 auto-refresh | ✅ Built |
| SKU / placement / print-type mapping | ⚠️ Built, **code tables not filled yet** |
| Adapter (submit / track / cancel / webhook) | ✅ Wired to real endpoints |
| Engine passes color + placement | ✅ |
| Sandbox credentials | ✅ In `.env.local` (gitignored) |
| Live credentials | ⏳ Pending (~2026-06-14) |
| End-to-end sandbox test order | ⬜ Next, once SKU tables filled |

## Verified facts (from the sandbox, 2026-06-11)

- Token endpoint: `POST https://sandbox.qikink.com/api/token`
  (form-urlencoded `ClientId`, `client_secret`).
- Response: `{ "ClientId": <num>, "Accesstoken": "<jwt>", "expires_in": 3600 }`
  — token lives **1 hour**.
- Live base: `https://api.qikink.com` · Sandbox base: `https://sandbox.qikink.com`.
- No public product/catalogue GET endpoint found under obvious paths (404s),
  so SKUs come from the dashboard **SKU sheet**, not auto-discovery.

## What's needed to finish (from the Qikink dashboard)

Fill these small code tables in `src/lib/fulfillment/qikink-sku.ts` from the
exported SKU sheet — not all 96 combos, just:

- **Garment code** for each of our 4 products (QK-001 Oversized Tee, QK-011
  Classic Tee, QK-002 Hoodie, QK-012 Sweatshirt).
- **Color code** for Black / White / Beige / Navy.
- Confirm the SKU assembly format (default `GARMENT-COLOR-SIZE`).

## Still marked "VERIFY" (confirm during sandbox test order)

- `design_code` placement param on the order line (front / back / left_chest).
- `print_type_id` numeric values (assumed DTG=1).
- Order-create response field for the provider order id
  (`order_id` / `id` / `qikink_order_id`).
- Webhook signature header name + status strings.
