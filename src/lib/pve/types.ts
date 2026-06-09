/**
 * Product Visualization Engine (PVE) — shared types.
 *
 * Asset taxonomy is intentionally broad so the Digital Twin can hold future
 * outputs (multi-angle, 3D, AR, lifestyle) without schema changes. Only a
 * subset is produced today; the rest populate when real supplier multi-angle
 * templates / renderers land.
 */

export type AssetType =
  | "primary"          // hero storefront image (composite)
  | "closeup"          // print-area detail crop
  | "thumbnail"        // grid/collection
  | "production_file"  // print-ready artwork at print DPI (no template)
  // ── future slots (model has them; not generated yet) ──
  | "back" | "side_left" | "side_right" | "angle_45" | "folded"
  | "fabric_detail" | "size_guide" | "packaging" | "lifestyle";

export interface RenderedAsset {
  asset_type: AssetType;
  url: string;
  width: number;
  height: number;
  meta?: Record<string, unknown>;
}

export interface ArtworkMetrics {
  width: number;
  height: number;
  hasAlpha: boolean;
  format: string;
}

export type IssueLevel = "error" | "warn" | "info";

export interface ValidationIssue {
  level: IssueLevel;
  code: string;
  message: string;
}

export interface ValidationReport {
  passed: boolean;                 // no errors
  issues: ValidationIssue[];
  metrics: {
    artwork: ArtworkMetrics;
    coverage: number;              // 0..1 of print area filled
    effectiveDpi: number;          // estimated DPI at production size
  };
}

export interface VisualizationScore {
  total: number;                   // 0..100
  factors: { label: string; score: number; max: number }[];
  threshold: number;               // per-product publish threshold
  publishable: boolean;            // total >= threshold and no errors
}
