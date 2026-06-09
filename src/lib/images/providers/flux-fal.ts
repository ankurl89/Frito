/**
 * Flux image provider (via fal.ai) — real raster artwork.
 *
 * Pipeline (Flux is 1024 on a background; print needs high-res + transparency):
 *   1. Flux (schnell/dev) → 1024 design on a plain background
 *   2. aura-sr → faithful 4× super-resolution (1024 → 4096) so artwork clears
 *      production DPI (apparel ~293 DPI, poster ~248). Faithful SR, NOT a
 *      "creative" upscale, so the design is never altered (PVE principle).
 *   3. birefnet → background removal → transparent PNG
 *
 * Activated only when FAL_KEY is set; otherwise the registry falls back to SVG.
 * Swappable behind the ImageProvider interface. Upscale is on by default;
 * set FLUX_UPSCALE=false to skip it.
 */

import { ImageProvider, GenerateArtworkInput, GeneratedArtwork } from "../types";

const FLUX_MODEL = process.env.FLUX_MODEL || "fal-ai/flux/schnell";
const UPSCALE_MODEL = "fal-ai/aura-sr";   // faithful 4× SR (no hallucinated detail)
const REMBG_MODEL = "fal-ai/birefnet";

function imageUrlOf(r: Record<string, unknown>): string | undefined {
  const single = (r.image as { url?: string } | undefined)?.url;
  const first = (r.images as { url: string }[] | undefined)?.[0]?.url;
  return single || first;
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

export class FluxFalProvider implements ImageProvider {
  readonly name = "flux-fal";

  isConfigured(): boolean {
    return !!process.env.FAL_KEY;
  }

  async generateArtwork({ prompt, transparent }: GenerateArtworkInput): Promise<GeneratedArtwork> {
    // 1) Generate the design. Prompt steers toward an isolated, printable graphic.
    const designPrompt =
      `${prompt}. Flat graphic print design, bold, high detail, centered composition, ` +
      `isolated on a plain solid white background, sticker style, die-cut, no mockup, ` +
      `no garment, no shadows, professional vector-like illustration.`;

    const gen = await falRun(FLUX_MODEL, {
      prompt: designPrompt,
      image_size: "square_hd",      // 1024×1024
      num_images: 1,
      enable_safety_checker: true,
    });

    let imageUrl = imageUrlOf(gen);
    if (!imageUrl) throw new Error("Flux returned no image");

    // 2) Faithful 4× super-resolution (1024 → 4096) so the artwork clears
    //    production DPI for large prints. Skipped if FLUX_UPSCALE=false.
    if (process.env.FLUX_UPSCALE !== "false") {
      try {
        const up = await falRun(UPSCALE_MODEL, { image_url: imageUrl });
        const upUrl = imageUrlOf(up);
        if (upUrl) imageUrl = upUrl;
      } catch (err) {
        console.warn("[flux-fal] upscale failed, using base resolution:", err);
      }
    }

    if (!transparent) {
      return { url: imageUrl, format: "png", provider: this.name };
    }

    // 3) Remove the background → transparent PNG.
    try {
      const cut = await falRun(REMBG_MODEL, { image_url: imageUrl });
      const out = imageUrlOf(cut);
      if (out) return { url: out, format: "png", provider: this.name };
    } catch (err) {
      console.warn("[flux-fal] bg removal failed, returning original:", err);
    }
    return { url: imageUrl, format: "png", provider: this.name };
  }
}
