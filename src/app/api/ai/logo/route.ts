import { NextRequest, NextResponse } from "next/server";
import { openrouter, MODELS } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";
import { guardAi } from "@/lib/guardrails/guard";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = await guardAi(user.id, "ai");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: 429 });

  const { brandName, logoPrompt, palette } = await req.json();

  const primary = palette?.primary || "#7c3aed";
  const accent = palette?.accent || "#4f46e5";

  const completion = await openrouter.chat.completions.create({
    model: MODELS.smart,
    messages: [{
      role: "user",
      content: `You are a world-class logo designer. Create a professional SVG logo for a brand called "${brandName}".

Design concept: ${logoPrompt}
Primary color: ${primary}
Accent color: ${accent}

Rules:
- Output ONLY the SVG code — no markdown, no explanation, no backticks
- SVG must start exactly with: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
- White background rectangle as first element
- Design a clean, memorable logo mark/icon (abstract shape, monogram, or icon)
- Optionally include the brand name in a clean modern font below the icon
- Use the brand colors
- Minimalist, bold, scalable — it must look great at any size
- At least 10 SVG elements for detail
- No raster images, only vector shapes and text`,
    }],
    max_tokens: 2000,
    temperature: 0.7,
  });

  const raw = completion.choices[0].message.content || "";
  const svgMatch = raw.match(/<svg[\s\S]*<\/svg>/i);

  if (!svgMatch) {
    return NextResponse.json({ url: null, error: "Logo generation failed" });
  }

  const svg = svgMatch[0];
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return NextResponse.json({ url: dataUri, svg });
}
