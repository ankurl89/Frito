import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { parseStoreHost } from "@/lib/domains";

/**
 * Resolve a branded subdomain or custom domain to the storefront route.
 * Returns a rewrite response, or null if the request should be handled normally
 * by the app. API and Next internals are never rewritten — only page requests.
 */
async function resolveStorefront(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  // Never reroute API, auth callbacks, or framework assets — only page paths.
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.startsWith("/store")) {
    return null;
  }

  const host = parseStoreHost(request.headers.get("host"));
  if (host.kind === "app") return null;

  let slug: string | null = null;
  if (host.kind === "subdomain") {
    slug = host.slug;
  } else if (host.kind === "custom") {
    // Look up which brand owns this custom domain.
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/brands?select=slug&custom_domain=eq.${encodeURIComponent(host.host)}&limit=1`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}` } }
    ).catch(() => null);
    const rows = res && res.ok ? await res.json().catch(() => []) : [];
    slug = Array.isArray(rows) && rows[0]?.slug ? rows[0].slug : null;
    if (!slug) return null; // unknown domain → let the app 404/handle it
  }

  if (!slug) return null;
  const url = request.nextUrl.clone();
  url.pathname = `/store/${slug}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export async function proxy(request: NextRequest) {
  // Host-based storefront routing comes first (subdomains / custom domains).
  const storefront = await resolveStorefront(request);
  if (storefront) return storefront;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
  const isAuth = pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuth && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)"],
};
