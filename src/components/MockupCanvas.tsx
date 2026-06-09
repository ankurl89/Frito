"use client";

/**
 * Mockup Canvas — Layer 3 of the Product Visualization System.
 *
 * Renders a supplier template image with the artwork composited at the
 * defined print area. Pure client-side HTML Canvas. The product itself
 * (garment shape, fit, proportions) is NEVER altered — only the artwork
 * is placed within the print rectangle.
 *
 * Usage:
 *   <MockupCanvas templateUrl="..." artworkUrl="..." printArea={...} />
 *   ref.current?.exportPNG()  // returns a Blob suitable for upload
 */

import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import { PrintArea } from "@/lib/qikink-catalog";

export interface MockupCanvasHandle {
  exportPNG: () => Promise<Blob | null>;
  exportProductionFile: () => Promise<Blob | null>;
}

interface Props {
  templateUrl: string;
  artworkUrl: string | null;
  printArea: PrintArea;
  /** Display size in pixels (canvas is rendered at 2x for crispness). */
  displaySize?: number;
  /** Show a dashed outline of the print area when no artwork is loaded. */
  showPrintArea?: boolean;
  /** Optional placement scale (1 = fit print area). */
  scale?: number;
  /** Optional placement offset within print area (px). */
  offsetX?: number;
  offsetY?: number;
  className?: string;
}

const MockupCanvas = forwardRef<MockupCanvasHandle, Props>(function MockupCanvas(
  {
    templateUrl,
    artworkUrl,
    printArea,
    displaySize = 600,
    showPrintArea = true,
    scale = 1,
    offsetX = 0,
    offsetY = 0,
    className = "",
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Internal render size — 2x display for crispness on hi-DPI screens.
  const RENDER = displaySize * 2;

  useEffect(() => {
    let cancelled = false;

    async function render() {
      setLoading(true);
      setError(null);
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = RENDER;
      canvas.height = RENDER;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      try {
        // 1. Draw template image (the source of truth — never modified visually).
        const template = await loadImage(templateUrl);
        if (cancelled) return;

        // Fit template to canvas (centred, contain).
        const tAspect = template.width / template.height;
        let tw = RENDER;
        let th = RENDER;
        if (tAspect > 1) th = RENDER / tAspect;
        else tw = RENDER * tAspect;
        const tx = (RENDER - tw) / 2;
        const ty = (RENDER - th) / 2;

        ctx.clearRect(0, 0, RENDER, RENDER);
        ctx.fillStyle = "#f4f4f5";
        ctx.fillRect(0, 0, RENDER, RENDER);
        ctx.drawImage(template, tx, ty, tw, th);

        // 2. Compute print area in canvas pixels (relative to template).
        const printX = tx + printArea.x * tw;
        const printY = ty + printArea.y * th;
        const printW = printArea.w * tw;
        const printH = printArea.h * th;

        // 3. Draw artwork into the print area (preserve aspect ratio).
        if (artworkUrl) {
          const artwork = await loadImage(artworkUrl);
          if (cancelled) return;

          const aAspect = artwork.width / artwork.height;
          let aw = printW * scale;
          let ah = printH * scale;
          // Fit artwork inside print area maintaining aspect ratio.
          if (aAspect > printW / printH) {
            ah = aw / aAspect;
          } else {
            aw = ah * aAspect;
          }
          const ax = printX + (printW - aw) / 2 + offsetX * 2;
          const ay = printY + (printH - ah) / 2 + offsetY * 2;

          ctx.drawImage(artwork, ax, ay, aw, ah);
        } else if (showPrintArea) {
          // No artwork yet — show the print area outline.
          ctx.save();
          ctx.strokeStyle = "rgba(124, 58, 237, 0.6)";
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 6]);
          ctx.strokeRect(printX, printY, printW, printH);
          ctx.fillStyle = "rgba(124, 58, 237, 0.05)";
          ctx.fillRect(printX, printY, printW, printH);
          ctx.fillStyle = "rgba(124, 58, 237, 0.8)";
          ctx.font = "600 11px monospace";
          ctx.textAlign = "center";
          ctx.fillText("PRINT AREA", printX + printW / 2, printY + printH / 2);
          ctx.restore();
        }

        setLoading(false);
      } catch (err) {
        console.error("Mockup render error:", err);
        setError("Could not load template");
        setLoading(false);
      }
    }

    render();
    return () => { cancelled = true; };
  }, [templateUrl, artworkUrl, printArea, scale, offsetX, offsetY, showPrintArea, RENDER]);

  // Imperative export functions.
  useImperativeHandle(ref, () => ({
    /** Export the rendered mockup as a PNG blob. */
    async exportPNG(): Promise<Blob | null> {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      return new Promise(resolve => canvas.toBlob(resolve, "image/png", 0.95));
    },
    /** Export the artwork at the print area's production pixel size. */
    async exportProductionFile(): Promise<Blob | null> {
      if (!artworkUrl) return null;
      try {
        const artwork = await loadImage(artworkUrl);
        const prodCanvas = document.createElement("canvas");
        prodCanvas.width = printArea.print_px_width;
        prodCanvas.height = printArea.print_px_height;
        const ctx = prodCanvas.getContext("2d");
        if (!ctx) return null;

        // Center artwork in the production canvas at full size, preserving aspect.
        const aAspect = artwork.width / artwork.height;
        const tAspect = prodCanvas.width / prodCanvas.height;
        let aw = prodCanvas.width;
        let ah = prodCanvas.height;
        if (aAspect > tAspect) ah = aw / aAspect;
        else aw = ah * aAspect;
        const ax = (prodCanvas.width - aw) / 2;
        const ay = (prodCanvas.height - ah) / 2;

        ctx.clearRect(0, 0, prodCanvas.width, prodCanvas.height);
        ctx.drawImage(artwork, ax, ay, aw, ah);

        return new Promise(resolve => prodCanvas.toBlob(resolve, "image/png", 0.95));
      } catch {
        return null;
      }
    },
  }));

  return (
    <div className={`relative ${className}`} style={{ width: displaySize, height: displaySize }}>
      <canvas
        ref={canvasRef}
        style={{ width: displaySize, height: displaySize }}
        className="rounded-2xl"
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-50/80 rounded-2xl">
          <div className="w-8 h-8 border-2 border-zinc-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-2xl">
          <p className="font-mono text-xs text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
});

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src.slice(0, 40)}…`));
    img.src = src;
  });
}

export default MockupCanvas;
