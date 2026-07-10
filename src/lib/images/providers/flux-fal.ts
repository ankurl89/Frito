/**
 * Flux image provider (via fal.ai) — real raster artwork.
 *
 * Pipeline (Flux generates ~1MP on a background; print needs high-res +
 * transparency):
 *   1. Flux (schnell/dev) → base design(s) on a plain background, sized to
 *      match the target print-area aspect (portrait/landscape/square)
 *   2. aura-sr → faithful 4× super-resolution so artwork clears production
 *      DPI (apparel ~293 DPI). Faithful SR, NOT a "creative" upscale, so the
 *      design is never altered (PVE principle).
 *   3. birefnet → background removal → transparent PNG
 *
 * QUALITY GUARANTEE: steps 2 and 3 are retried once and then FAIL LOUDLY.
 * A silent fallback here would send a low-res or opaque file toward print —
 * a visible error the founder can retry is always better than a bad garment.
 *
 * Two-phase mode: generateCandidates() returns fast base-resolution options
 * (no upscale/rembg — cheap); finalizeArtwork() runs the expensive steps on
 * the founder's pick only.
 *
 * Activated only when FAL_KEY is set; otherwise the registry falls back to
 * SVG. Swappable behind the ImageProvider interface.
 */

import { ImageProvider, GenerateArtworkInput, GeneratedArtwork, ArtworkAspect } from "../types";

const FLUX_MODEL = process.env.FLUX_MODEL || "fal-ai/flux/schnell";
const UPSCALE_MODEL = "fal-ai/aura-sr";   // faithful 4× SR (no hallucinated detail)
const REMBG_MODEL = "fal-ai/birefnet";

/** Print-area-matched generation sizes (multiples of 32, ≈1MP). */
const ASPECT_SIZE: Record<ArtworkAspect, { width: number; height: number }> = {
  square:    { width: 1024, height: 1024 },
  portrait:  { width: 1024, height: 1344 },   // ≈3:4 — chest/back prints
  landscape: { width: 1344, height: 1024 },
};

function imageUrlOf(r: Record<string, unknown>): string | undefined {
  const single = (r.image as { url?: string } | undefined)?.url;
  const first = (r.images as { url: string }[] | undefined)?.[0]?.url;
  return single || first;
}

function imageUrlsOf(r: Record<string, unknown>): string[] {
  const many = (r.images as { url: string }[] | undefined)?.map(i => i.url).filter(Boolean);
  if (many?.length) return many;
  const one = imageUrlOf(r);
  return one ? [one] : [];
}

async function falRun(model: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${process.env.FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`fal ${model} failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return res.json();
}

/** Run a fal step with one retry; throw a founder-readable error on failure. */
async function falStep(
  model: string,
  input: Record<string, unknown>,
  friendly: string
): Promise<Record<string, unknown>> {
  try {
    return await falRun(model, input);
  } catch (err) {
    console.warn(`[flux-fal] ${model} failed once, retrying:`, err);
    try {
      return await falRun(model, input);
    } catch (err2) {
      console.error(`[flux-fal] ${model} failed twice:`, err2);
      throw new Error(friendly);
    }
  }
}

function designPromptOf({ prompt, brandColors }: GenerateArtworkInput): string {
  const colorLine = brandColors?.length
    ? ` Colour styling: harmonise with the brand palette (${brandColors.join(", ")}) unless the design clearly demands otherwise.`
    : "";
  return (
    `${prompt}.${colorLine} Flat graphic print design, bold, high detail, centered composition, ` +
    `isolated on a plain solid white background, sticker style, die-cut, no mockup, ` +
    `no garment, no shadows, professional vector-like illustration.`
  );
}

export class FluxFalProvider implements ImageProvider {
  readonly name = "flux-fal";

  isConfigured(): boolean {
    return !!process.env.FAL_KEY;
  }

  /** Fast base-resolution options — no upscale/rembg until one is chosen. */
  async generateCandidates(input: GenerateArtworkInput, count: number): Promise<GeneratedArtwork[]> {
    const size = ASPECT_SIZE[input.aspect || "square"];
    const gen = await falStep(FLUX_MODEL, {
      prompt: designPromptOf(input),
      image_size: size,
      num_images: Math.max(1, Math.min(4, count)),
      enable_safety_checker: true,
    }, "Artwork generation failed — please try again.");

    const urls = imageUrlsOf(gen);
    if (!urls.length) throw new Error("Artwork generation returned no images — please try again.");
    return urls.map(url => ({ url, format: "png" as const, provider: this.name }));
  }

  /** Upscale to print resolution + cut the background. Fails loudly. */
  async finalizeArtwork(url: string, { transparent }: { transparent: boolean }): Promise<GeneratedArtwork> {
    // Faithful 4× super-resolution so the artwork clears production DPI.
    const up = await falStep(UPSCALE_MODEL, { image_url: url },
      "Preparing the artwork for print failed (upscaling) — please try again.");
    const upUrl = imageUrlOf(up);
    if (!upUrl) throw new Error("Preparing the artwork for print failed (upscaling) — please try again.");

    if (!transparent) {
      return { url: upUrl, format: "png", provider: this.name };
    }

    // Background removal → transparent PNG. Required for garments; an opaque
    // file would print as a solid rectangle, so this is NOT allowed to fail
    // silently.
    const cut = await falStep(REMBG_MODEL, { image_url: upUrl },
      "Preparing the artwork for print failed (background removal) — please try again.");
    const out = imageUrlOf(cut);
    if (!out) throw new Error("Preparing the artwork for print failed (background removal) — please try again.");
    return { url: out, format: "png", provider: this.name };
  }

  /** Single-shot path: one candidate, finalized. */
  async generateArtwork(input: GenerateArtworkInput): Promise<GeneratedArtwork> {
    const [candidate] = await this.generateCandidates(input, 1);
    return this.finalizeArtwork(candidate.url, { transparent: input.transparent });
  }
}
