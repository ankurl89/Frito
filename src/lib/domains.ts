/**
 * Storefront domain resolution.
 *
 * The platform serves three kinds of host:
 *   - the app itself          (tryfrito.com / app.tryfrito.com / *.vercel.app / localhost)
 *   - a branded subdomain      (<brand-slug>.tryfrito.com)         → that brand's store
 *   - a merchant custom domain (shop.theirbrand.com)               → that brand's store
 *
 * The middleware uses parseStoreHost() to decide whether to rewrite a request
 * to the storefront route (/store/<slug>) based on the incoming Host header.
 *
 * The base domain is configured via NEXT_PUBLIC_STORE_DOMAIN (e.g. "tryfrito.com")
 * so nothing is hardcoded. If it's unset, subdomain routing is simply off and
 * the app falls back to path-based storefronts (/store/<slug>).
 */

export const STORE_DOMAIN = (process.env.NEXT_PUBLIC_STORE_DOMAIN || "")
  .toLowerCase()
  .replace(/^https?:\/\//, "")
  .replace(/\/.*$/, "")
  .trim();

export type StoreHost =
  | { kind: "app" }
  | { kind: "subdomain"; slug: string }
  | { kind: "custom"; host: string };

/** Normalize a Host header to a bare lowercase hostname (no port). */
export function normalizeHost(host: string | null | undefined): string {
  return (host || "").toLowerCase().split(":")[0].trim();
}

/**
 * Classify an incoming host. Pure + synchronous — a "custom" result still needs
 * a DB lookup by the caller to find which brand (if any) owns that domain.
 */
export function parseStoreHost(rawHost: string | null | undefined): StoreHost {
  const h = normalizeHost(rawHost);
  if (!h) return { kind: "app" };

  // The app's own hosts are never storefronts.
  if (h === "localhost" || h === "127.0.0.1" || h.endsWith(".vercel.app")) {
    return { kind: "app" };
  }

  if (STORE_DOMAIN) {
    if (h === STORE_DOMAIN || h === `www.${STORE_DOMAIN}` || h === `app.${STORE_DOMAIN}`) {
      return { kind: "app" };
    }
    if (h.endsWith(`.${STORE_DOMAIN}`)) {
      const slug = h.slice(0, -(STORE_DOMAIN.length + 1));
      if (slug && slug !== "www" && slug !== "app") return { kind: "subdomain", slug };
      return { kind: "app" };
    }
  }

  // Anything else is a candidate custom domain (resolve against brands.custom_domain).
  return { kind: "custom", host: h };
}

/** The public URL of a brand's store on the branded subdomain (if configured). */
export function subdomainUrl(slug: string): string | null {
  if (!STORE_DOMAIN || !slug) return null;
  return `https://${slug}.${STORE_DOMAIN}`;
}
