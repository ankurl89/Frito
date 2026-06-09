/**
 * Image provider registry — selects the best configured artwork generator.
 *
 * Priority: Flux (if FAL_KEY present) → Claude-SVG (always available).
 * This is how "models are replaceable": add a provider, register it, done.
 */

import { ImageProvider } from "./types";
import { FluxFalProvider } from "./providers/flux-fal";
import { SvgClaudeProvider } from "./providers/svg-claude";

const flux = new FluxFalProvider();
const svg = new SvgClaudeProvider();

// Highest-quality first; first one that's configured wins.
const ORDERED: ImageProvider[] = [flux, svg];

export function getImageProvider(): ImageProvider {
  return ORDERED.find(p => p.isConfigured()) || svg;
}

export function activeProviderName(): string {
  return getImageProvider().name;
}
