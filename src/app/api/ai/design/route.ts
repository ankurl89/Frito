import { NextRequest, NextResponse } from "next/server";
import { openrouter, MODELS } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";
import { getImageProvider } from "@/lib/images/registry";
import { ArtworkAspect } from "@/lib/images/types";
import { AI_CONSTRAINTS } from "@/lib/v1-commerce";
import { guardAi } from "@/lib/guardrails/guard";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Artwork generation API — phase 1 of 2 (candidates).
 *
 * Produces ONLY the print artwork (never a product mockup — the PVE composites
 * it onto a real template later). Returns base-resolution CANDIDATES for the
 * founder to choose between; /api/ai/design/finalize runs the expensive
 * print-prep (4× upscale + background removal) on the chosen one only.
 *
 * Pipeline:
 *   1. Screen + enrich the founder's prompt (IP/trademark guard; print-design
 *      vocabulary added while preserving their intent). Vague prompts get a
 *      full creative-direction pass instead.
 *   2. getImageProvider() → Flux (real raster) if FAL_KEY, else Claude-SVG.
 *      Candidates are generated at an aspect matched to the target print area.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Guardrail: image generation is the real-money path (Flux).
  const guard = await guardAi(user.id, "ai_image");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: 429 });

  const { brandDNA, productName, productCategory, userDescription, printArea } = await req.json();
  const palette = brandDNA?.palette || {};
  const brandColors = [palette.primary, palette.secondary, palette.accent].filter(Boolean);

  const userPrompt = (userDescription || "").trim();
  const isSpecific = userPrompt.length >= 10;

  // Aspect matched to the target print area (portrait chest/back prints ≠ square).
  let aspect: ArtworkAspect = "square";
  if (printArea?.width && printArea?.height) {
    const ratio = printArea.width / printArea.height;
    aspect = ratio < 0.9 ? "portrait" : ratio > 1.1 ? "landscape" : "square";
  }

  // ── 1) Creative direction ──
  let concept: string;
  if (isSpecific) {
    // Screen for IP problems + enrich with print-design vocabulary, PRESERVING
    // the founder's subject and intent. Fails open on LLM hiccups (the
    // original prompt is used) but a definite block is respected.
    concept = `Design for a ${productName}: ${userPrompt}. Brand vibe: ${brandDNA.niche}, ${brandDNA.voice_tone}.`;
    try {
      const screen = await openrouter.chat.completions.create({
        model: MODELS.fast,
        messages: [{
          role: "user",
          content: `You screen and improve prompts for a print-on-demand design generator.

FOUNDER'S REQUEST: "${userPrompt}"
PRODUCT: ${productName} · BRAND VIBE: ${brandDNA.niche}, ${brandDNA.voice_tone}

1. BLOCK if the request clearly asks for protected IP: real brand names/logos (Nike, Adidas...), named fictional characters or franchises (anime/movie/game characters by name), celebrity likenesses, or team/band logos. Generic styles ("anime style", "streetwear graphic") are FINE.
2. If allowed, rewrite the request as one vivid print-design brief (max 50 words): keep the founder's exact subject and intent, add composition/style language suited to garment printing. Never change what they asked for.

Output ONLY JSON: {"allowed": true|false, "reason": "shown to the founder if blocked", "prompt": "the enriched brief (empty if blocked)"}`,
        }],
        max_tokens: 220,
        temperature: 0.4,
      });
      const raw = screen.choices[0].message.content || "";
      const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || "{}");
      if (parsed.allowed === false) {
        return NextResponse.json(
          { error: parsed.reason || "That design can't be printed — it references protected characters or logos. Describe an original design instead." },
          { status: 422 }
        );
      }
      if (parsed.prompt) {
        concept = `${parsed.prompt} (for a ${productName})`;
      }
    } catch (err) {
      console.warn("[ai/design] prompt screen failed open:", err);
    }
  } else {
    const conceptPass = await openrouter.chat.completions.create({
      model: MODELS.smart,
      messages: [{
        role: "user",
        content: `${AI_CONSTRAINTS}

You are a creative director. Describe ARTWORK (a flat graphic with a transparent background) to be screen-printed on a ${productName} for this brand:
- Brand: ${brandDNA.name} · ${brandDNA.niche}
- Audience: ${brandDNA.target_audience}
- Voice: ${brandDNA.voice_tone}
Give one specific, vivid design concept (central subject, style, composition). It is artwork only — never describe the garment itself, a mockup, or a person wearing it. Never reference existing brands, franchises, or characters. Max 60 words. No preamble.`,
      }],
      max_tokens: 180,
      temperature: 0.9,
    });
    concept = conceptPass.choices[0].message.content?.trim() || `A design that captures ${brandDNA.name}`;
  }

  // ── 2) Generate candidates via the active image provider ──
  const provider = getImageProvider();
  const needsTransparency = ["Apparel", "Accessories"].includes(productCategory);
  const input = { prompt: concept, brandColors, transparent: needsTransparency, aspect };

  try {
    if (provider.generateCandidates) {
      // Fast base-resolution options; finalize runs on the founder's pick.
      const candidates = await provider.generateCandidates(input, 3);
      return NextResponse.json({
        candidates: candidates.map(c => ({ url: c.url, format: c.format, final: false })),
        concept,
        prompt: userPrompt || concept,
        provider: provider.name,
        needsTransparency,
      });
    }

    // Single-shot providers (SVG) return final artwork directly.
    const artwork = await provider.generateArtwork(input);
    return NextResponse.json({
      candidates: [{ url: artwork.url, format: artwork.format, final: true }],
      url: artwork.url,                    // back-compat for single-shot flows
      concept,
      prompt: userPrompt || concept,
      provider: artwork.provider,
      needsTransparency,
    });
  } catch (err) {
    console.error("[ai/design] provider failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Artwork generation failed" },
      { status: 502 }
    );
  }
}
