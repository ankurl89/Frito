import { NextRequest, NextResponse } from "next/server";
import { openrouter, MODELS } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandDNA, productName, productCategory, userDescription } = await req.json();

  const palette = brandDNA.palette || {};
  const primary = palette.primary || "#7c3aed";
  const secondary = palette.secondary || "#4f46e5";
  const accent = palette.accent || "#f59e0b";
  const textColor = palette.text || "#111111";
  const bgColor = palette.background || "#ffffff";

  // Step 1: Creative director pass — figure out WHAT to design based on full brand context
  const conceptPass = await openrouter.chat.completions.create({
    model: MODELS.smart,
    messages: [{
      role: "user",
      content: `You are a creative director at a top D2C brand agency. A founder needs a print design for their product.

BRAND BRIEF:
- Brand name: ${brandDNA.name}
- Tagline: ${brandDNA.tagline}
- Story: ${brandDNA.story}
- Niche: ${brandDNA.niche}
- Target audience: ${brandDNA.target_audience}
- Brand values: ${(brandDNA.brand_values || []).join(", ")}
- Voice & tone: ${brandDNA.voice_tone}
- Price positioning: ${brandDNA.price_tier}

PRODUCT:
- Type: ${productName} (${productCategory})
- Founder's request: ${userDescription || "Create something that perfectly captures the brand"}

YOUR TASK:
Write a specific visual design concept for this product's print. Include:
1. The central visual element or illustration (be very specific — not "an animal" but "a bold linework fox mid-leap, viewed from the side")
2. Supporting elements (patterns, shapes, text, background texture)
3. Composition layout (where each element sits in the 800x800 canvas)
4. Typography — any words/slogans and what font style they should have
5. Color application — which brand colors go where

Be opinionated. This should feel like it was designed specifically for ${brandDNA.target_audience} who love ${brandDNA.niche}. Max 200 words.`,
    }],
    max_tokens: 400,
    temperature: 0.9,
  });

  const visualConcept = conceptPass.choices[0].message.content || "";

  // Step 2: Execute the concept as SVG
  const svgPass = await openrouter.chat.completions.create({
    model: MODELS.smart,
    messages: [
      {
        role: "user",
        content: `You are a professional SVG developer and graphic designer. Build this design as a complete, detailed SVG.

VISUAL CONCEPT:
${visualConcept}

BRAND COLORS (use these exactly):
- Primary: ${primary}
- Secondary: ${secondary}
- Accent: ${accent}
- Text: ${textColor}
- Background: ${bgColor}

BRAND: ${brandDNA.name} | ${brandDNA.tagline}

TECHNICAL RULES:
- Output ONLY raw SVG code — no markdown fences, no explanation, nothing else
- First line must be: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
- Last line must be: </svg>
- Include a background rect as the first element
- Use SVG paths, circles, rects, polygons, text, and groups — make it detailed (20+ elements)
- For text: use font-family="Arial, sans-serif" or font-family="Georgia, serif" depending on brand tone
- All shapes must be fully formed with correct SVG syntax
- Center the design visually within the 800x800 canvas
- The design must feel like it belongs on a real ${productName} sold to ${brandDNA.target_audience}`,
      }
    ],
    max_tokens: 4000,
    temperature: 0.5,
  });

  const raw = svgPass.choices[0].message.content || "";

  // Extract SVG — handle both bare SVG and markdown-wrapped
  let svg = "";
  const fenced = raw.match(/```(?:svg|xml)?\s*\n([\s\S]*?)\n```/i);
  if (fenced) {
    svg = fenced[1].trim();
  } else {
    const direct = raw.match(/<svg[\s\S]*<\/svg>/i);
    if (direct) svg = direct[0];
  }

  if (!svg) {
    return NextResponse.json({ url: null, svg: null, concept: visualConcept, error: "SVG generation failed" });
  }

  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return NextResponse.json({
    url: dataUri,
    svg,
    concept: visualConcept,
    prompt: userDescription || "AI-generated brand design",
  });
}
