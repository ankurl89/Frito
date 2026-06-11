import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getTemplate, placementTarget } from "@/lib/qikink-catalog";
import { colorHex, DEFAULT_COLOR } from "@/lib/v1-commerce";
import { render } from "@/lib/pve/renderer";
import { validateArtwork } from "@/lib/pve/validation";
import { computeScore } from "@/lib/pve/score";
import { getVisualizationProfile } from "@/lib/pve/profiles";
import { guardBurst } from "@/lib/guardrails/guard";

export const runtime = "nodejs";        // Sharp needs the Node runtime
export const maxDuration = 60;

/**
 * POST /api/pve/render
 *
 * The PVE entry point. Runs: validate → render (Sharp) → score → persist assets.
 * Returns the asset set + validation report + visualization score.
 *
 * Body: { productTemplateId, artwork (data URI/url), placement, brandPalette,
 *         productId? } — productId optional (assets are persisted only if given;
 *         the new-product flow renders before the product row exists, so it
 *         renders to a temp id and re-homes on save).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Burst guard — rendering uploads several large PNGs (storage + bandwidth).
  if (!(await guardBurst(`render:${user.id}`, 20))) {
    return NextResponse.json({ error: "Too many renders in a short window — give it a moment." }, { status: 429 });
  }

  const {
    productTemplateId, artwork, placementKey, brandPalette, productId,
    scale, offsetX, offsetY, color, isDefault = true,
  } = await req.json();
  const template = getTemplate(productTemplateId);
  if (!template) return NextResponse.json({ error: "Unknown product template" }, { status: 400 });
  if (!artwork) return NextResponse.json({ error: "Artwork required" }, { status: 400 });

  // Template-driven placement → view template + cutout + print area.
  const { url: templateUrl, cutout, printArea } = placementTarget(template, placementKey);
  const colorName = color || DEFAULT_COLOR;
  const colorSlug = String(colorName).toLowerCase();
  const pid = productId || `tmp-${user.id.slice(0, 8)}-${Date.now()}`;

  try {
    // 1) Render (also extracts artwork metrics + brand color match).
    const { assets, artworkMetrics, brandColorMatch } = await render({
      productId: pid,
      templateUrl,
      printArea,
      artwork,
      palette: brandPalette || {},
      placement: { scale, offset_x: offsetX, offset_y: offsetY },
      color: colorHex(colorName),
      cutoutUrl: cutout,
    });

    // 2) Resolve this product's visualization profile (per-product rules).
    const profile = getVisualizationProfile(template.category, template.id);

    // 3) Validate + score against the profile.
    const validation = validateArtwork({ artwork: artworkMetrics, printArea, profile });
    const score = computeScore({ validation, brandColorMatch, profile });

    // 4) Persist asset rows + score if this is a real product.
    if (productId) {
      const svc = createServiceClient();
      const primary = assets.find(a => a.asset_type === "primary");
      const production = assets.find(a => a.asset_type === "production_file");
      const thumb = assets.find(a => a.asset_type === "thumbnail");

      // Canonical asset rows + product summary only for the default color.
      if (isDefault) {
        for (const a of assets) {
          await svc.from("product_assets").upsert({
            product_id: productId,
            asset_type: a.asset_type,
            url: a.url,
            width: a.width,
            height: a.height,
            meta: { ...(a.meta || {}), color: colorName },
            updated_at: new Date().toISOString(),
          }, { onConflict: "product_id,asset_type" });
        }
        await svc.from("products").update({
          mockup_url: primary?.url,
          production_file_url: production?.url,
          visualization_score: score.total,
          validation_report: { validation, score },
        }).eq("id", productId);
      }

      // Per-color mockup rows (additive; one hero + thumb per color).
      if (primary) {
        await svc.from("product_assets").upsert({
          product_id: productId,
          asset_type: `primary:${colorSlug}`,
          url: primary.url, width: primary.width, height: primary.height,
          meta: { color: colorName },
          updated_at: new Date().toISOString(),
        }, { onConflict: "product_id,asset_type" });
      }
      if (thumb) {
        await svc.from("product_assets").upsert({
          product_id: productId,
          asset_type: `thumbnail:${colorSlug}`,
          url: thumb.url, width: thumb.width, height: thumb.height,
          meta: { color: colorName },
          updated_at: new Date().toISOString(),
        }, { onConflict: "product_id,asset_type" });
      }
    }

    return NextResponse.json({ assets, validation, score });
  } catch (err) {
    console.error("[pve/render] failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Render failed" },
      { status: 500 }
    );
  }
}
