import { createClient } from "@/lib/supabase/client";

/**
 * Upload a Blob to the `mockups` public bucket.
 * Returns the public URL.
 */
export async function uploadMockup(blob: Blob, filename: string): Promise<string> {
  const supabase = createClient();
  const path = `${Date.now()}-${filename}`;
  const { error } = await supabase.storage
    .from("mockups")
    .upload(path, blob, { contentType: "image/png", cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("mockups").getPublicUrl(path);
  return data.publicUrl;
}
