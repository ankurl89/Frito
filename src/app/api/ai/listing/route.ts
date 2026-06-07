import { NextRequest, NextResponse } from "next/server";
import { openrouter, MODELS } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandDNA, productName, productCategory, designDescription } = await req.json();

  const completion = await openrouter.chat.completions.create({
    model: MODELS.fast,
    messages: [{
      role: "user",
      content: `Generate a product listing for a D2C brand. Output ONLY valid JSON.

Brand: ${brandDNA.name}
Tagline: ${brandDNA.tagline}
Brand voice: ${brandDNA.voice_tone}
Target audience: ${brandDNA.target_audience}
Product: ${productName} (${productCategory})
Design: ${designDescription || "brand-aligned graphic design"}

Output this JSON:
{
  "listing_title": "Compelling product title (max 80 chars, include brand name)",
  "listing_description": "3-4 paragraph product description matching the brand voice. Include key features, who it's for, and a call to action.",
  "seo_tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"]
}`,
    }],
    max_tokens: 800,
    temperature: 0.7,
  });

  const raw = completion.choices[0].message.content || "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  try {
    const listing = JSON.parse(jsonMatch?.[0] || "{}");
    return NextResponse.json(listing);
  } catch {
    return NextResponse.json({ error: "Failed to generate listing" }, { status: 500 });
  }
}
