import { NextRequest, NextResponse } from "next/server";
import { openrouter, MODELS } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getImageProvider } from "@/lib/images/registry";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Artwork generation API.
 *
 * Produces ONLY the print artwork (transparent), never a product mockup —
 * the PVE composites it onto a real template later.
 *
 * Pipeline:
 *   1. Build creative direction (brand-contextualised prompt).
 *   2. getImageProvider() → Flux (real raster) if FAL_KEY, else Claude-SVG.
 *   3. Re-host remote raster output to our bucket (stable + CORS-safe).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandDNA, productName, productCategory, userDescription } = await req.json();
  const palette = brandDNA?.palette || {};
  const brandColors = [palette.primary, palette.secondary, palette.accent].filter(Boolean);

  const userPrompt = (userDescription || "").trim();
  const isSpecific = userPrompt.length >= 10;

  // ── 1) Creative direction ──
  let concept: string;
  if (isSpecific) {
    // Honor the user's exact request; brand only informs styling.
    concept = `Design for a ${productName}: ${userPrompt}. Brand vibe: ${brandDNA.niche}, ${brandDNA.voice_tone}.`;
  } else {
    const conceptPass = await openrouter.chat.completions.create({
      model: MODELS.smart,
      messages: [{
        role: "user",
        content: `You are a creative director. Describe ARTWORK to print on a ${productName} for this brand:
- Brand: ${brandDNA.name} · ${brandDNA.niche}
- Audience: ${brandDNA.target_audience}
- Voice: ${brandDNA.voice_tone}
Give one specific, vivid design concept (central subject, style, composition). Max 60 words. No preamble.`,
      }],
      max_tokens: 180,
      temperature: 0.9,
    });
    concept = conceptPass.choices[0].message.content?.trim() || `A design that captures ${brandDNA.name}`;
  }

  // ── 2) Generate via the active image provider ──
  const provider = getImageProvider();
  const needsTransparency = ["Apparel", "Accessories"].includes(productCategory);

  let artwork;
  try {
    artwork = await provider.generateArtwork({
      prompt: concept,
      brandColors,
      transparent: needsTransparency,
    });
  } catch (err) {
    console.error("[ai/design] provider failed:", err);
    return NextResponse.json(
      { url: null, concept, error: err instanceof Error ? err.message : "Artwork generation failed" },
      { status: 200 }
    );
  }

  // ── 3) Stabilise the asset URL ──
  // SVG data URIs are small & stable → return as-is. Remote raster (Flux) is
  // re-hosted to our bucket so it survives provider URL expiry and is CORS-safe
  // for the browser placement preview.
  let finalUrl = artwork.url;
  if (artwork.format === "png" && artwork.url.startsWith("http")) {
    try {
      const buf = Buffer.from(await (await fetch(artwork.url)).arrayBuffer());
      const svc = createServiceClient();
      const path = `_artwork/${user.id.slice(0, 8)}-${randomUUID().slice(0, 8)}.png`;
      const { error } = await svc.storage.from("product-assets").upload(path, buf, {
        contentType: "image/png", upsert: true, cacheControl: "31536000",
      });
      if (!error) {
        finalUrl = svc.storage.from("product-assets").getPublicUrl(path).data.publicUrl;
      }
    } catch (err) {
      console.warn("[ai/design] re-host failed, using provider url:", err);
    }
  }

  return NextResponse.json({
    url: finalUrl,
    artwork_url: finalUrl,
    concept,
    prompt: userPrompt || concept,
    provider: artwork.provider,
    format: artwork.format,
  });
}
