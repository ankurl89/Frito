/**
 * PVE Rendering Pipeline (Systems 4/5/6) — server-side, Sharp.
 *
 * Composites validated artwork onto a real supplier template at high
 * resolution with fabric-aware blending, then derives the storefront asset
 * set. Every output originates from the SAME Digital Twin inputs, so
 * placement/color stay identical across assets (the consistency guarantee).
 *
 * Honest scope: we derive primary + print close-up + thumbnail + the print-
 * ready production file from a single front template. Back/side/45°/folded are
 * NOT fabricated — those populate when real multi-angle supplier templates
 * exist (the asset model already has the slots).
 */

import sharp from "sharp";
import { createServiceClient } from "@/lib/supabase/service";
import { PrintArea } from "@/lib/qikink-catalog";
import { RenderedAsset, ArtworkMetrics } from "./types";

const RENDER = 2048;          // storefront primary edge (px)
const BG = { r: 244, g: 244, b: 245, alpha: 1 };

export interface RenderInput {
  productId: string;
  templateUrl: string;
  printArea: PrintArea;
  /** Artwork as a data URI (svg/png/jpeg) or remote URL. */
  artwork: string;
  placement: { scale: number; offset_x: number; offset_y: number };
  palette: Record<string, string>;
}

export interface RenderOutput {
  assets: RenderedAsset[];
  artworkMetrics: ArtworkMetrics;
  brandColorMatch: number;     // 0..1
}

/** Decode a data URI or fetch a URL into a Buffer. */
async function toBuffer(src: string): Promise<Buffer> {
  if (src.startsWith("data:")) {
    const base64 = src.split(",")[1] || "";
    return Buffer.from(base64, "base64");
  }
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Failed to fetch ${src.slice(0, 60)}`);
  return Buffer.from(await res.arrayBuffer());
}

function hexToRgb(hex: string) {
  const c = (hex || "").replace("#", "");
  const f = c.length === 3 ? c.split("").map(x => x + x).join("") : c;
  const n = parseInt(f, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export async function render(input: RenderInput): Promise<RenderOutput> {
  const { printArea, placement, palette } = input;

  // ── Load inputs. SVG rasterized at high density for crisp edges. ──
  const templateBuf = await toBuffer(input.templateUrl);
  const artRaw = await toBuffer(input.artwork);
  const isSvg = input.artwork.includes("image/svg") || artRaw.slice(0, 200).includes(Buffer.from("<svg"));
  const artworkBase = sharp(artRaw, isSvg ? { density: 300 } : undefined).ensureAlpha();
  const artMeta = await artworkBase.metadata();

  const artworkMetrics: ArtworkMetrics = {
    width: artMeta.width || 0,
    height: artMeta.height || 0,
    hasAlpha: artMeta.hasAlpha ?? false,
    format: artMeta.format || "unknown",
  };

  // ── Brand color match (dominant artwork color vs palette) ──
  let brandColorMatch = 0.5;
  try {
    const stats = await sharp(await artworkBase.png().toBuffer()).stats();
    const dom = stats.dominant;
    const paletteRgbs = Object.values(palette).map(hexToRgb).filter(Boolean) as { r: number; g: number; b: number }[];
    if (paletteRgbs.length && dom) {
      const dist = Math.min(...paletteRgbs.map(p =>
        Math.sqrt((p.r - dom.r) ** 2 + (p.g - dom.g) ** 2 + (p.b - dom.b) ** 2)));
      brandColorMatch = Math.max(0, Math.min(1, 1 - dist / 441));
    }
  } catch { /* non-fatal */ }

  // ── Compose base: template "contained" on a neutral square canvas ──
  const tMeta = await sharp(templateBuf).metadata();
  const tw0 = tMeta.width || RENDER, th0 = tMeta.height || RENDER;
  const fit = Math.min(RENDER / tw0, RENDER / th0);
  const tw = Math.round(tw0 * fit), th = Math.round(th0 * fit);
  const tx = Math.round((RENDER - tw) / 2), ty = Math.round((RENDER - th) / 2);

  const templateResized = await sharp(templateBuf).resize(tw, th).toBuffer();
  const baseBuf = await sharp({ create: { width: RENDER, height: RENDER, channels: 4, background: BG } })
    .composite([{ input: templateResized, left: tx, top: ty }])
    .png()
    .toBuffer();

  // ── Print rect (px) within the contained template ──
  const printX = tx + printArea.x * tw;
  const printY = ty + printArea.y * th;
  const printW = printArea.w * tw;
  const printH = printArea.h * th;

  // Placement box (scale + offset). Offsets were authored in a 500px preview.
  const boxW = printW * placement.scale;
  const boxH = printH * placement.scale;
  const offX = (placement.offset_x || 0) * (RENDER / 500);
  const offY = (placement.offset_y || 0) * (RENDER / 500);

  // Fit artwork inside the box preserving aspect.
  const artResizedBuf = await sharp(await artworkBase.png().toBuffer())
    .resize(Math.round(boxW), Math.round(boxH), { fit: "inside" })
    .png()
    .toBuffer();
  const arMeta = await sharp(artResizedBuf).metadata();
  const aw = arMeta.width || 0, ah = arMeta.height || 0;
  const artX = Math.round(printX + (printW - aw) / 2 + offX);
  const artY = Math.round(printY + (printH - ah) / 2 + offY);

  // ── Fabric-aware blend: pull garment texture under the print, soft-light it
  //    into the artwork so wrinkles/shadows read through the print. ──
  let texturedArt = artResizedBuf;
  try {
    const exLeft = Math.max(0, Math.min(RENDER - aw, artX));
    const exTop = Math.max(0, Math.min(RENDER - ah, artY));
    if (aw > 0 && ah > 0 && exLeft + aw <= RENDER && exTop + ah <= RENDER) {
      const garmentTexture = await sharp(baseBuf)
        .extract({ left: exLeft, top: exTop, width: aw, height: ah })
        .greyscale()
        .linear(0.4, 77)        // compress contrast toward mid-grey (subtle)
        .png()
        .toBuffer();

      // Preserve the artwork's transparency: the soft-light texture is opaque,
      // so compositing it directly would fill the transparent background with
      // grey. We blend RGB, then re-apply the artwork's original alpha so only
      // the printed (opaque) pixels pick up the fabric texture.
      const alphaMask = await sharp(artResizedBuf).ensureAlpha().extractChannel(3).png().toBuffer();
      const blendedRgb = await sharp(artResizedBuf)
        .composite([{ input: garmentTexture, blend: "soft-light" }])
        .removeAlpha()
        .png()
        .toBuffer();
      texturedArt = await sharp(blendedRgb).joinChannel(alphaMask).png().toBuffer();
    }
  } catch (err) {
    console.warn("[pve] fabric blend skipped:", err);
    /* texture is enhancement-only; fall back to flat art */
  }

  // ── PRIMARY ──
  const primaryBuf = await sharp(baseBuf)
    .composite([{ input: texturedArt, left: artX, top: artY }])
    .png()
    .toBuffer();

  // ── THUMBNAIL ──
  const thumbBuf = await sharp(primaryBuf).resize(512, 512).png().toBuffer();

  // ── CLOSE-UP: crop print region with margin, upscale ──
  const margin = 0.18;
  const cuX = Math.max(0, Math.round(printX - printW * margin));
  const cuY = Math.max(0, Math.round(printY - printH * margin));
  const cuW = Math.min(RENDER - cuX, Math.round(printW * (1 + margin * 2)));
  const cuH = Math.min(RENDER - cuY, Math.round(printH * (1 + margin * 2)));
  const closeupBuf = await sharp(primaryBuf)
    .extract({ left: cuX, top: cuY, width: Math.max(1, cuW), height: Math.max(1, cuH) })
    .resize(1024, 1024, { fit: "inside" })
    .png()
    .toBuffer();

  // ── PRODUCTION FILE: artwork at target print resolution, transparent, no template ──
  const prodBuf = await sharp(await artworkBase.png().toBuffer())
    .resize(printArea.print_px_width, printArea.print_px_height, {
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // ── Upload all to product-assets bucket ──
  const assets: RenderedAsset[] = [];
  const uploads: { type: RenderedAsset["asset_type"]; buf: Buffer; w: number; h: number }[] = [
    { type: "primary", buf: primaryBuf, w: RENDER, h: RENDER },
    { type: "closeup", buf: closeupBuf, w: 1024, h: 1024 },
    { type: "thumbnail", buf: thumbBuf, w: 512, h: 512 },
    { type: "production_file", buf: prodBuf, w: printArea.print_px_width, h: printArea.print_px_height },
  ];

  const svc = createServiceClient();
  for (const u of uploads) {
    const path = `${input.productId}/${u.type}-${Date.now()}.png`;
    const { error } = await svc.storage.from("product-assets").upload(path, u.buf, {
      contentType: "image/png", upsert: true, cacheControl: "31536000",
    });
    if (error) throw new Error(`Upload failed (${u.type}): ${error.message}`);
    const { data } = svc.storage.from("product-assets").getPublicUrl(path);
    assets.push({ asset_type: u.type, url: data.publicUrl, width: u.w, height: u.h });
  }

  return { assets, artworkMetrics, brandColorMatch };
}
