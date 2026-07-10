import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getImageProvider } from "@/lib/images/registry";
import { rehostPng } from "@/lib/images/rehost";
import { guardAi } from "@/lib/guardrails/guard";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/ai/design/finalize — phase 2 of artwork generation.
 *
 * Takes the candidate the founder chose and makes it print-ready: faithful 4×
 * super-resolution + background removal (both fail loudly — see the provider),
 * then re-hosts the result to our bucket so the URL is stable and CORS-safe.
 *
 * Data-URI candidates (SVG provider) are already final and pass through.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = await guardAi(user.id, "ai_image");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: 429 });

  const { url, transparent = true } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Candidate url required" }, { status: 400 });
  }

  // SVG data URIs are already final (vector, transparent).
  if (url.startsWith("data:")) {
    return NextResponse.json({ url, format: "svg" });
  }

  const provider = getImageProvider();
  try {
    const finalized = provider.finalizeArtwork
      ? await provider.finalizeArtwork(url, { transparent })
      : { url, format: "png" as const, provider: provider.name };

    const stableUrl = await rehostPng(user.id, finalized.url);
    return NextResponse.json({ url: stableUrl, format: finalized.format });
  } catch (err) {
    console.error("[ai/design/finalize] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Preparing the artwork for print failed — please try again." },
      { status: 502 }
    );
  }
}
