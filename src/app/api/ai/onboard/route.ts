import { NextRequest, NextResponse } from "next/server";
import { openrouter, MODELS } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";
import { guardAi } from "@/lib/guardrails/guard";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/ai/onboard — the workshop's single rich generation.
 *
 * Input: { niches: string[], description: string }
 * Output: a complete Brand Blueprint PLUS the "intelligent" layers the
 * onboarding workshop reveals — an interpretation of the founder's idea, a
 * brand-opportunity read, and recommended first products.
 *
 * Collapsing the old multi-turn chat into one call is deliberate: the user
 * types one sentence and sees a full brand in seconds = "I can actually do this".
 */
const SYSTEM = `You are Frito, an elite brand strategist running a founder's brand-building workshop. The founder gives you a niche and one sentence. You produce a complete, opinionated brand — the kind an agency would charge lakhs for — plus a sharp market read.

Voice: confident, specific, a little visionary. Never generic. No filler.

Return ONLY a JSON object (no markdown, no prose) with EXACTLY this shape:

{
  "interpretation": "One punchy sentence reflecting their idea back, sharper than they said it. e.g. 'So — premium anime streetwear for fans who've outgrown fan merch.'",
  "name": "Brand name (inventive, ownable, not generic)",
  "tagline": "Short, memorable tagline",
  "story": "2-3 sentence origin story that feels real and emotional",
  "niche": "specific niche",
  "target_audience": "Who they are (age, mindset, what they care about)",
  "brand_values": ["value1","value2","value3"],
  "voice_tone": "How the brand speaks",
  "price_tier": "budget|mid|premium|luxury",
  "palette": { "primary":"#hex","secondary":"#hex","accent":"#hex","background":"#hex","text":"#hex" },
  "typography": { "heading":"font style","body":"font style","style":"descriptor" },
  "logo_prompt": "Detailed prompt to generate a logo",
  "opportunity": {
    "demand": "one line on market demand with a concrete signal",
    "competition": "one line on the competitive landscape",
    "trend": "one line on a current trend tailwind",
    "positioning": "the sharp angle this brand should own to win"
  },
  "recommended_products": [
    { "name":"Product type","why":"one line why it's a strong first product","margin":"e.g. 65%","popularity":"High|Medium|Low","difficulty":"Easy|Medium|Hard" }
  ]
}

Recommend 3 products, ordered easiest-first. Make every field specific to THIS brand.`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = await guardAi(user.id, "ai");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: 429 });

  const { niches, description } = await req.json();
  const nicheLine = Array.isArray(niches) && niches.length ? niches.join(", ") : "open to ideas";

  try {
    const completion = await openrouter.chat.completions.create({
      model: MODELS.smart,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Niche focus: ${nicheLine}\nFounder's one-liner: "${description || "Help me figure it out."}"` },
      ],
      temperature: 0.85,
      max_tokens: 2000,
    });

    const raw = completion.choices[0].message.content || "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    const data = JSON.parse(match[0]);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[ai/onboard] failed:", err);
    return NextResponse.json({ error: "Generation failed — please try again." }, { status: 500 });
  }
}
