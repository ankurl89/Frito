/**
 * Guardrails — rate limiting + per-plan AI quotas.
 *
 * Postgres-backed (bump_rate RPC) so limits are correct across serverless
 * instances — in-memory counters don't work when every request may hit a fresh
 * lambda. AI endpoints are low-frequency, so the extra round trip is negligible.
 *
 * Usage in a route (after resolving the user):
 *   const g = await guardAi(user.id, "ai_image");
 *   if (!g.ok) return NextResponse.json({ error: g.error }, { status: 429 });
 */

import { createServiceClient } from "@/lib/supabase/service";
import { limitsFor, PlanName } from "./limits";

type Guard = { ok: true; plan: PlanName } | { ok: false; error: string; retryAfter?: number };

function minuteKey() { return new Date().toISOString().slice(0, 16); }   // YYYY-MM-DDTHH:mm
function dayKey() { return new Date().toISOString().slice(0, 10); }      // YYYY-MM-DD

async function bump(bucket: string, window: string): Promise<number> {
  const svc = createServiceClient();
  const { data, error } = await svc.rpc("bump_rate", { p_bucket: bucket, p_window: window });
  if (error) {
    // Fail OPEN on limiter errors — never block legitimate users because the
    // limiter hiccuped. The DLQ/monitoring would surface a broken limiter.
    console.error("[guard] bump_rate failed:", error.message);
    return 0;
  }
  return (data as number) ?? 0;
}

async function planFor(userId: string): Promise<PlanName> {
  const svc = createServiceClient();
  const { data } = await svc.from("profiles").select("plan").eq("id", userId).maybeSingle();
  return (data?.plan as PlanName) || "free";
}

/**
 * Guard an AI generation call. `kind`:
 *   "ai"       — text generation (brand, listing, book, onboard, logo)
 *   "ai_image" — image generation (Flux) — the real-money path
 */
export async function guardAi(userId: string, kind: "ai" | "ai_image"): Promise<Guard> {
  const plan = await planFor(userId);
  const limits = limitsFor(plan);

  // 1) Burst limit (per minute, all AI).
  const perMin = await bump(`aimin:${userId}`, minuteKey());
  if (perMin > limits.aiPerMin) {
    return { ok: false, error: "You're going a little fast — give it a minute and try again.", retryAfter: 60 };
  }

  // 2) Daily cap by kind.
  if (kind === "ai_image") {
    const n = await bump(`aiimg:${userId}`, dayKey());
    if (n > limits.aiImagePerDay) {
      return { ok: false, error: `You've hit today's design-generation limit on the ${plan} plan. It resets tomorrow — or upgrade for more.` };
    }
  } else {
    const n = await bump(`ai:${userId}`, dayKey());
    if (n > limits.aiPerDay) {
      return { ok: false, error: `You've hit today's AI limit on the ${plan} plan. It resets tomorrow — or upgrade for more.` };
    }
  }

  return { ok: true, plan };
}

/** Per-minute burst guard for a named bucket (e.g. render, checkout). */
export async function guardBurst(key: string, perMin: number): Promise<boolean> {
  const n = await bump(`burst:${key}`, minuteKey());
  return n <= perMin;
}

/** IP-based per-minute guard for public/unauthenticated endpoints. */
export async function guardIp(ip: string, scope: string, perMin: number): Promise<boolean> {
  const n = await bump(`ip:${scope}:${ip}`, minuteKey());
  return n <= perMin;
}

/** Resolve the per-plan brand cap for create-time enforcement. */
export async function brandLimit(userId: string): Promise<number> {
  return limitsFor(await planFor(userId)).brands;
}
