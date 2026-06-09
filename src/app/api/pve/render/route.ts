import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getTemplate } from "@/lib/qikink-catalog";
import { render } from "@/lib/pve/renderer";
import { validateArtwork } from "@/lib/pve/validation";
import { computeScore } from "@/lib/pve/score";
import { getVisualizationProfile } from "@/lib/pve/profiles";

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

  const { productTemplateId, artwork, placement, brandPalette, productId } = await req.json();
  const template = getTemplate(productTemplateId);
  if (!template) return NextResponse.json({ error: "Unknown product template" }, { status: 400 });
  if (!artwork) return NextResponse.json({ error: "Artwork required" }, { status: 400 });

  const printArea = template.views.front.print_area;
  const pid = productId || `tmp-${user.id.slice(0, 8)}-${Date.now()}`;

  try {
    // 1) Render (also extracts artwork metrics + brand color match).
    const { assets, artworkMetrics, brandColorMatch } = await render({
      productId: pid,
      templateUrl: template.views.front.url,
      printArea,
      artwork,
      placement: placement || { scale: 1, offset_x: 0, offset_y: 0 },
      palette: brandPalette || {},
    });

    // 2) Resolve this product's visualization profile (per-product rules).
    const profile = getVisualizationProfile(template.category, template.id);

    // 3) Validate + score against the profile.
    const validation = validateArtwork({ artwork: artworkMetrics, printArea, profile });
    const score = computeScore({ validation, brandColorMatch, profile });

    // 4) Persist asset rows + score if this is a real product.
    if (productId) {
      const svc = createServiceClient();
      for (const a of assets) {
        await svc.from("product_assets").upsert({
          product_id: productId,
          asset_type: a.asset_type,
          url: a.url,
          width: a.width,
          height: a.height,
          meta: a.meta || {},
          updated_at: new Date().toISOString(),
        }, { onConflict: "product_id,asset_type" });
      }
      const primary = assets.find(a => a.asset_type === "primary");
      const production = assets.find(a => a.asset_type === "production_file");
      await svc.from("products").update({
        mockup_url: primary?.url,
        production_file_url: production?.url,
        visualization_score: score.total,
        validation_report: { validation, score },
      }).eq("id", productId);
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
