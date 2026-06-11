/**
 * Qikink authentication.
 *
 * Qikink does NOT use a static API token. You exchange your ClientId +
 * client_secret for a short-lived access token, then send that token on every
 * request. This module performs that exchange and caches the token in-process
 * until shortly before it expires.
 *
 *   POST {base}/api/token   (form-urlencoded: ClientId, client_secret)
 *   → { Accesstoken: "...", expires_in?: <seconds> }
 *
 * Env:
 *   QIKINK_CLIENT_ID      — from dashboard.qikink.com → Integration → Custom API
 *   QIKINK_CLIENT_SECRET  — same place
 *   QIKINK_BASE           — optional; defaults to live. Set to the sandbox base
 *                           (https://sandbox.qikink.com) while testing.
 *   QIKINK_API_TOKEN      — optional escape hatch: a pre-minted token. If set,
 *                           it's used verbatim and no exchange happens.
 *
 * NOTE: field/endpoint names follow Qikink's documented shape but should be
 * confirmed against the sandbox during Phase 2. Anything marked VERIFY is an
 * assumption isolated here so it's a one-line fix if Qikink differs.
 */

export const QIKINK_BASE = process.env.QIKINK_BASE?.replace(/\/$/, "") || "https://api.qikink.com";

/** True when we lack the credentials needed to talk to Qikink for real. */
export function isQikinkSandbox(): boolean {
  if (process.env.QIKINK_API_TOKEN) return false;
  return !process.env.QIKINK_CLIENT_ID || !process.env.QIKINK_CLIENT_SECRET;
}

interface CachedToken {
  token: string;
  /** epoch ms after which the token must be refreshed */
  expiresAt: number;
}

let cache: CachedToken | null = null;

/** Refresh this many ms before the real expiry, to avoid edge-of-expiry 401s. */
const SAFETY_WINDOW_MS = 60_000;
/** Fallback lifetime if Qikink doesn't return expires_in. */
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000; // 6h

/**
 * Return a valid Qikink access token, exchanging credentials if needed.
 * Cached across calls within the same server process.
 */
export async function getQikinkAccessToken(): Promise<string> {
  // Escape hatch: a manually-minted token.
  const manual = process.env.QIKINK_API_TOKEN;
  if (manual) return manual;

  const clientId = process.env.QIKINK_CLIENT_ID;
  const clientSecret = process.env.QIKINK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Qikink credentials missing (QIKINK_CLIENT_ID / QIKINK_CLIENT_SECRET)");
  }

  if (cache && Date.now() < cache.expiresAt) return cache.token;

  const form = new URLSearchParams();
  form.set("ClientId", clientId);
  form.set("client_secret", clientSecret);

  const res = await fetch(`${QIKINK_BASE}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Qikink token exchange failed (${res.status}): ${JSON.stringify(raw).slice(0, 200)}`);
  }

  // VERIFY: confirm the exact field names against the sandbox response.
  const token: string | undefined = raw.Accesstoken || raw.access_token || raw.token;
  if (!token) throw new Error(`Qikink token response had no token: ${JSON.stringify(raw).slice(0, 200)}`);

  const ttlSeconds: number | undefined = raw.expires_in;
  const ttlMs = ttlSeconds ? ttlSeconds * 1000 : DEFAULT_TTL_MS;
  cache = { token, expiresAt: Date.now() + ttlMs - SAFETY_WINDOW_MS };
  return token;
}

/** Clear the cached token (e.g. after a 401 so the next call re-exchanges). */
export function clearQikinkTokenCache(): void {
  cache = null;
}

/** Standard auth headers for a Qikink API call. */
export async function qikinkAuthHeaders(): Promise<Record<string, string>> {
  return {
    ClientId: process.env.QIKINK_CLIENT_ID || "",
    Accesstoken: await getQikinkAccessToken(),
  };
}
