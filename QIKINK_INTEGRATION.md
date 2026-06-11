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

All of the above are now reflected in the adapter (`qikink.ts`), so the
order-create and tracking calls match the documented shapes.

## What's needed to finish (from the Qikink dashboard)

Fill these small code tables in `src/lib/fulfillment/qikink-sku.ts` from the
exported SKU sheet — not all 96 combos, just:

- **Garment code** for each of our 4 products (QK-001 Oversized Tee, QK-011
  Classic Tee, QK-002 Hoodie, QK-012 Sweatshirt).
- **Color code** for Black / White / Beige / Navy.
- Confirm the SKU assembly format (default `GARMENT-COLOR-SIZE`).

## Still marked "VERIFY" (confirm during sandbox test order)

- Color codes for **Black / Beige / Navy** (White=`Wh` seen) — from the SKU sheet.
- `placement_sku` codes for back (`bk`) and pocket (`lc`) — `fr` is confirmed.
- `print_type_id` numeric values (assumed DTG=1).
- The order **status** enumeration for the production lifecycle (we saw
  `"Archived"`; the in-production / shipped strings in STATUS_MAP are still
  best-guess until a real order moves through them).
- Webhook payload shape + signature header (no webhook in the collection —
  configured separately in the dashboard, if available in sandbox).
- Whether a real cancel endpoint exists.

_Resolved since first pass: token shape, create-order body, SKU format,
placement field name (`placement_sku`), tracking endpoint + fields, order-id
response field (`order_id`)._
