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
| SKU / placement / print-type mapping | ✅ **Filled from the dashboard SKU sheet** |
| Adapter (submit / track / cancel / webhook) | ✅ Wired + **validated against sandbox** |
| Engine passes color + placement | ✅ |
| Sandbox credentials | ✅ In `.env.local` (gitignored) |
| Live credentials | ⏳ Pending (~2026-06-14) |
| End-to-end sandbox test order | ✅ **Order created (id 10715712) + tracking read** |

## Final garment + color mapping (from sku_descriptions sheet)

| Our product | Qikink garment | Garment code | Base ₹ |
|---|---|---|---|
| QK-001 Oversized T-Shirt | Oversized Classic T-Shirt | `UOsMRnHs` | 265 |
| QK-011 Classic Unisex T-Shirt | Supima T-Shirt | `USuRnHs` | 300 |
| QK-002 Hoodie | Hoodie (standard) | `UHd` | 490 |
| QK-012 Sweatshirt | Sweatshirt | `USs` | 390 |

Colors: Black `Bk` · White `Wh` · Navy `Nb` (Qikink "Navy Blue") · Maroon `Mn`.
Beige was dropped — Qikink stocks no Beige hoodie/sweatshirt. All four colors
exist on every chosen garment. Example SKU: `UOsMRnHs-Bk-M`.

## Verified facts (from the sandbox + official Postman collection, 2026-06-11)

- **Token**: `POST {base}/api/token` (form-urlencoded `ClientId`, `client_secret`)
  → `{ "ClientId": <num>, "Accesstoken": "<jwt>", "expires_in": 3600 }`.
  Token lives **1 hour**. (Tested live against sandbox — works.)
- **Auth headers**: every call sends `ClientId` + `Accesstoken`.
- **Rate limit**: 30 requests / minute.
- **Create order**: `POST {base}/api/order/create` →
  `{ "message": "...", "order_id": <num>, "status_code": "200" }`.
  Body: `order_number`, `qikink_shipping`, `gateway`, `total_order_value`,
  `line_items[]` (`sku`, `quantity`, `price`, `print_type_id`,
  `designs[]` with `placement_sku` + `design_code` + `design_link` +
  `mockup_link` + `width_inches`/`height_inches`), and `shipping_address`
  (`first_name`, `last_name`, `address1`, `address2`, `phone`, `email`,
  `city`, `province`, `zip`, `country_code`).
- **SKU format**: `GARMENT-COLOR-SIZE`, e.g. `MVnHs-Wh-S`, `UOsMRnHs-Lv-XL`
  (`Wh`=White, `Lv`=Lavender; 2-letter color codes). Our `composeSku` matches.
- **placement_sku**: short codes; `"fr"` (front) confirmed in docs.
- **List orders**: `GET {base}/api/order`. **Single order**:
  `GET {base}/api/order?id={id}&from_date=&to_date=` → object with
  `status`, `total_order_value`, `line_items[]`, and `shipping{ awb,
  tracking_link, ... }`. Tracking = `shipping.awb` / `shipping.tracking_link`.
- **No products/catalogue API** exists in the collection — SKUs must come from
  the dashboard SKU sheet (confirmed, not just 404 guessing).
- **No cancel endpoint** in the collection — post-submit cancellation is likely
  support-only. `cancelOrder` is a best-effort guess (VERIFY).
- Base URLs: Live `https://api.qikink.com` · Sandbox `https://sandbox.qikink.com`.
- **order_number max 15 chars** — our UUID ids are stripped to ≤15 chars in the
  adapter (deterministic, so idempotent resubmits still dedupe).
- New order status is **"On Hold"** (→ submitted_to_provider). Tracking GET
  returns a **single-element array**; tracking = `shipping.awb` /
  `shipping.tracking_link`; courier = `shipping.courier_provider_name`.
- A print costs ~₹100 (`printing_cost`) on top of the garment base; the line
  `price` is informational (Qikink bills its own cost). Treat margins as
  garment-base only until print + shipping are modelled.

All of the above are reflected in the adapter (`qikink.ts`). A full sandbox
order was created and read back successfully (order_id 10715712).

## What's needed to finish (from the Qikink dashboard)

Fill these small code tables in `src/lib/fulfillment/qikink-sku.ts` from the
exported SKU sheet — not all 96 combos, just:

- **Garment code** for each of our 4 products (QK-001 Oversized Tee, QK-011
  Classic Tee, QK-002 Hoodie, QK-012 Sweatshirt).
- **Color code** for Black / White / Beige / Navy.
- Confirm the SKU assembly format (default `GARMENT-COLOR-SIZE`).

## Still marked "VERIFY" (low risk — confirm as real orders flow)

- `placement_sku` codes for back (`bk`) and pocket (`lc`) — only `fr` is
  confirmed (create + read-back showed `placement: "Front"`).
- `print_type_id` = 1 (DTG) accepted by sandbox; confirm DTF id if ever needed.
- Production lifecycle **status** strings beyond `"On Hold"` / `"Archived"`
  (in-production / shipped / delivered) — confirm as a real order progresses.
- Webhook payload shape + signature header (configured in the dashboard;
  not in the API collection).
- Whether a real cancel endpoint exists.

_Resolved: token shape, create-order body (incl. order_number ≤15 chars),
SKU format + real garment/color codes, placement field (`placement_sku`/`fr`),
tracking endpoint + array shape + awb/tracking_link/courier fields, order-id
response field. A full sandbox order was created and read back._
