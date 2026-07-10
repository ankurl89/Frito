/**
 * Print Validation Engine (System 2).
 *
 * Validates manufacturability of an artwork asset against a product's print
 * area + production target + its Visualization Profile (per-product rules).
 */

import { ArtworkMetrics, ValidationReport, ValidationIssue } from "./types";
import { PrintArea } from "@/lib/qikink-catalog";
import { VisualizationProfile } from "./profiles";

interface ValidateInput {
  artwork: ArtworkMetrics;
  printArea: PrintArea;
  profile: VisualizationProfile;
}

const MIN_DIMENSION = 600;     // px — below this, print quality is poor

export function validateArtwork({ artwork, printArea, profile }: ValidateInput): ValidationReport {
  const issues: ValidationIssue[] = [];

  // ── Resolution ──
  if (artwork.width < MIN_DIMENSION || artwork.height < MIN_DIMENSION) {
    issues.push({
      level: "error",
      code: "low_resolution",
      message: `Artwork is ${artwork.width}×${artwork.height}px. Minimum ${MIN_DIMENSION}×${MIN_DIMENSION}px for print.`,
    });
  }

  // ── Effective DPI at production size (floor varies by product) ──
  const targetPx = Math.max(printArea.print_px_width, printArea.print_px_height);
  const sourcePx = Math.max(artwork.width, artwork.height);
  const effectiveDpi = Math.round((sourcePx / targetPx) * 300);
  if (effectiveDpi < profile.minDpi) {
    issues.push({
      level: effectiveDpi < profile.minDpi * 0.66 ? "error" : "warn",
      code: "low_dpi",
      message: `Effective print resolution ~${effectiveDpi} DPI. This product needs at least ${profile.minDpi} DPI — use higher-resolution artwork.`,
    });
  }

  // ── Transparency (required per profile) ──
  // ERROR, not a warning: on garments an opaque file prints as a solid
  // rectangle (e.g. a white box on a black hoodie). Never allow it through.
  if (profile.requireTransparency && !artwork.hasAlpha) {
    issues.push({
      level: "error",
      code: "no_transparency",
      message: "Artwork has no transparent background — it would print as a solid rectangle on the garment. Use a transparent PNG.",
    });
  }

  // ── Aspect ratio fit vs print area ──
  const artAspect = artwork.width / artwork.height;
  const areaAspect = printArea.print_px_width / printArea.print_px_height;
  const aspectMismatch = Math.abs(Math.log(artAspect / areaAspect));
  if (aspectMismatch > 0.7) {
    issues.push({
      level: "warn",
      code: "aspect_mismatch",
      message: "Artwork shape differs a lot from the print area — expect significant empty space around it.",
    });
  }

  // ── Coverage of print area ──
  const scale = Math.min(areaAspect / artAspect, 1) * Math.min(artAspect / areaAspect, 1);
  const coverage = Math.min(1, Math.max(0.1, isFinite(scale) ? Math.sqrt(scale) : 0.5));
  if (coverage < profile.minCoverage) {
    issues.push({
      level: "warn",
      code: "low_coverage",
      message: `Design fills only ${Math.round(coverage * 100)}% of the print area. This product looks best at ${Math.round(profile.minCoverage * 100)}%+.`,
    });
  }

  return {
    passed: !issues.some(i => i.level === "error"),
    issues,
    metrics: { artwork, coverage, effectiveDpi },
  };
}
