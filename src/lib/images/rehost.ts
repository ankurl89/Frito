/**
 * Re-host a remote raster (e.g. a fal.ai output URL) into our own storage
 * bucket so it survives provider URL expiry and is CORS-safe for the browser
 * placement preview. Data URIs are returned unchanged.
 */

import { createServiceClient } from "@/lib/supabase/service";
import { randomUUID } from "crypto";

export async function rehostPng(ownerKey: string, url: string): Promise<string> {
  if (!url.startsWith("http")) return url;
  try {
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    const svc = createServiceClient();
    const path = `_artwork/${ownerKey.slice(0, 8)}-${randomUUID().slice(0, 8)}.png`;
    const { error } = await svc.storage.from("product-assets").upload(path, buf, {
      contentType: "image/png", upsert: true, cacheControl: "31536000",
    });
    if (error) throw error;
    return svc.storage.from("product-assets").getPublicUrl(path).data.publicUrl;
  } catch (err) {
    console.warn("[rehost] failed, using provider url:", err);
    return url;
  }
}
