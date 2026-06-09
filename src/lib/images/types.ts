/**
 * Image generation provider contract.
 *
 * Per the PVE principle "all models must be replaceable", artwork generation
 * goes through this interface. Adapters: Claude-SVG (default, no key) and
 * Flux (real raster, needs FAL_KEY). Adding a model = one class.
 *
 * Providers receive a final, brand-contextualised prompt (the creative
 * direction is built upstream in /api/ai/design) and return artwork.
 */

export interface GenerateArtworkInput {
  prompt: string;
  brandColors?: string[];
  /** Apparel/accessories need a transparent background for compositing. */
  transparent: boolean;
}

export interface GeneratedArtwork {
  /** Remote URL (Flux) OR data URI (SVG). The PVE renderer handles both. */
  url: string;
  format: "png" | "svg";
  provider: string;
  /** Raw SVG markup when format === "svg" (optional, for editing later). */
  svg?: string;
}

export interface ImageProvider {
  readonly name: string;
  /** True if env/credentials are present to actually run. */
  isConfigured(): boolean;
  generateArtwork(input: GenerateArtworkInput): Promise<GeneratedArtwork>;
}
