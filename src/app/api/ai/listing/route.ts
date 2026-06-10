import { NextRequest, NextResponse } from "next/server";
import { openrouter, MODELS } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";
import { guardAi } from "@/lib/guardrails/guard";

/**
 * Generates a product listing in the brand's voice.
 *
 * Brand Memory System — if the brand has a brand_book, we feed it into the
 * prompt so the listing matches the brand's documented archetype, "We Are /
 * We Are Not", and copy examples. This is the Brand Consistency Engine in
 * action: every generated asset reflects the Brand Book.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = await guardAi(user.id, "ai");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: 429 });

  const { brandDNA, productName, productCategory, designDescription } = await req.json();
  const book = brandDNA.brand_book || {};

  // Build the brand-memory section only if a brand book exists.
  const memoryBlock = book.archetype ? `
BRAND BOOK MEMORY (reference for tone & voice)
- Archetype: ${book.archetype}
- We are: ${(book.we_are || []).join(", ")}
- We are not: ${(book.we_are_not || []).join(", ")}
- Personality: ${(book.personality_traits || []).map((p: { trait: string }) => p.trait).join(", ")}
- Sample headlines from this brand: ${(book.headlines || []).slice(0, 3).join(" | ")}
- Sample copy: ${(book.copy_examples || []).slice(0, 2).map((c: { say: string }) => c.say).join(" | ")}
` : "";

  const completion = await openrouter.chat.completions.create({
    model: MODELS.fast,
    messages: [{
      role: "user",
      content: `Generate a product listing for a D2C brand. Output ONLY valid JSON.

BRAND
- Name: ${brandDNA.name}
- Tagline: ${brandDNA.tagline}
- Voice: ${brandDNA.voice_tone}
- Audience: ${brandDNA.target_audience}
${memoryBlock}
PRODUCT
- ${productName} (${productCategory})
- Design: ${designDescription || "brand-aligned graphic design"}

Output exactly this JSON shape:
{
  "listing_title": "Compelling title (max 80 chars). Match the brand voice. Do not just describe — sell the feeling.",
  "listing_description": "3-4 paragraph description in the brand's voice. Reference the audience's aspirations, not just product specs. Include features and CTA.",
  "seo_tags": ["8-10 SEO tags relevant to product + audience"]
}`,
    }],
    max_tokens: 1000,
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
