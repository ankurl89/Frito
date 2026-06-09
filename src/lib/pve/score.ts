/**
 * Visualization Score (Systems 7/8 — quality scoring + consistency gate).
 *
 * Score is computed against the product's Visualization Profile: factor
 * weights AND the publish threshold differ per product. A poster is judged
 * mostly on resolution; a t-shirt on transparency + placement.
 */

import { ValidationReport, VisualizationScore } from "./types";
import { VisualizationProfile } from "./profiles";

interface ScoreInput {
  validation: ValidationReport;
  brandColorMatch: number;   // 0..1
  profile: VisualizationProfile;
}

export function computeScore({ validation, brandColorMatch, profile }: ScoreInput): VisualizationScore {
  const m = validation.metrics;
  const w = profile.weights;

  // RESOLUTION & DPI — scaled against this product's DPI floor.
  const dpiRatio = Math.min(1, m.effectiveDpi / Math.max(profile.minDpi, 1));
  const resolution = Math.round(dpiRatio * w.resolution);

  // PRINT READINESS — errors tank it; missing-required-transparency dents it.
  const hasErrors = validation.issues.some(i => i.level === "error");
  const transparencyMiss = validation.issues.some(i => i.code === "no_transparency");
  const printReadiness = hasErrors
    ? Math.round(w.printReadiness * 0.2)
    : transparencyMiss
      ? Math.round(w.printReadiness * 0.6)
      : w.printReadiness;

  // PLACEMENT COVERAGE — relative to this product's coverage target.
  const coverageRatio = Math.min(1, m.coverage / Math.max(profile.minCoverage, 0.01));
  const coverage = Math.round(coverageRatio * w.coverage);

  // BRAND CONSISTENCY.
  const brand = Math.round(brandColorMatch * w.brand);

  // ASPECT & QUALITY.
  const aspectWarn = validation.issues.some(i => i.code === "aspect_mismatch");
  const aspect = aspectWarn ? Math.round(w.aspect * 0.4) : w.aspect;

  const factors = [
    { label: "Resolution & DPI", score: resolution, max: w.resolution },
    { label: "Print readiness", score: printReadiness, max: w.printReadiness },
    { label: "Placement coverage", score: coverage, max: w.coverage },
    { label: "Brand consistency", score: brand, max: w.brand },
    { label: "Aspect & quality", score: aspect, max: w.aspect },
  ];

  const total = factors.reduce((s, f) => s + f.score, 0);

  return {
    total,
    factors,
    threshold: profile.threshold,
    publishable: total >= profile.threshold && !hasErrors,
  };
}
