import { NextRequest, NextResponse } from "next/server";
import { openrouter, MODELS } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";
import { awardXP } from "@/lib/founder-engine";
import { guardAi } from "@/lib/guardrails/guard";

/**
 * POST /api/ai/brand-book
 *
 * Generates the COMPLETE Brand Book for an existing brand.
 *
 * Body: { brandId: string }
 *
 * This is a heavy call (15-45s) — the model receives the lightweight brand DNA
 * and expands it into a full 17-section brand operating system.
 *
 * Sets brand_book_status to "generating" → "ready" / "failed" on completion.
 * Future AI calls (product listings, design, social, email) reference the
 * brand_book for tone, persona, and visual consistency.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = await guardAi(user.id, "ai");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: 429 });

  const { brandId } = await req.json();
  if (!brandId) return NextResponse.json({ error: "brandId required" }, { status: 400 });

  // Load the existing brand DNA.
  const { data: brand, error: e1 } = await supabase
    .from("brands")
    .select("*")
    .eq("id", brandId)
    .eq("user_id", user.id)
    .single();
  if (e1 || !brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  // Mark generating.
  await supabase.from("brands").update({ brand_book_status: "generating" }).eq("id", brandId);

  const palette = brand.palette || {};

  const prompt = `You are a senior brand strategist at a top branding agency. Build a complete Brand Book for an existing brand. The output must feel like work delivered by a real agency, not a templated AI.

BRAND DNA (already created)
- Name: ${brand.name}
- Tagline: ${brand.tagline}
- Story: ${brand.story}
- Niche: ${brand.niche}
- Target audience: ${brand.target_audience}
- Brand values: ${(brand.brand_values || []).join(", ")}
- Voice & tone: ${brand.voice_tone}
- Price tier: ${brand.price_tier}
- Palette: primary ${palette.primary}, secondary ${palette.secondary}, accent ${palette.accent}

OUTPUT
Return a single JSON object with this EXACT shape. No markdown fences, no explanation, just the JSON. Every field must be filled with specific, opinionated, brand-aligned content. Be concrete — no generic agency-speak.

{
  "alternative_names": ["3-5 alt name options that fit the brand vibe"],
  "domain_suggestions": ["5-7 .com / .store / .co domains the founder could buy"],
  "brand_meaning": "2-3 sentences explaining why the name works, emotional resonance, audience appeal",

  "mission": "Why the company exists. One punchy sentence.",
  "vision": "Long-term ambition. One sentence.",
  "brand_promise": "What customers consistently get. One sentence.",

  "persona": {
    "age_range": "e.g. 18-28",
    "gender_mix": "e.g. 60% male / 35% female / 5% other",
    "location": "e.g. Tier 1 & Tier 2 Indian metros",
    "income": "e.g. ₹6L-15L per year",
    "interests": ["6-8 specific interests"],
    "buying_behavior": "How they shop, where, frequency, decision drivers",
    "motivations": "Why they buy — emotional drivers",
    "pain_points": "What frustrates them about existing options",
    "aspirations": "Who they want to become"
  },

  "personality_traits": [
    { "trait": "Bold", "how_it_shows": "In headlines, in color choices, in product photography" },
    { "trait": "...", "how_it_shows": "..." }
  ],

  "archetype": "Pick one: Creator | Explorer | Hero | Rebel | Sage | Everyman | Magician | Outlaw | Lover | Jester | Ruler | Caregiver",
  "archetype_reasoning": "Why this archetype fits — 2-3 sentences",

  "we_are": ["4-6 adjectives for the voice"],
  "we_are_not": ["4-6 adjectives to avoid"],

  "taglines": ["4-6 tagline options"],
  "headlines": ["5-7 marketing headline examples"],
  "copy_examples": [
    { "instead_of": "Generic / bad version", "say": "On-brand version" },
    { "instead_of": "...", "say": "..." }
  ],

  "palette_meanings": [
    { "color": "Primary", "hex": "${palette.primary}", "meaning": "What this colour signals" },
    { "color": "Secondary", "hex": "${palette.secondary}", "meaning": "..." },
    { "color": "Accent", "hex": "${palette.accent}", "meaning": "..." }
  ],
  "typography_detail": {
    "headline_font": "Specific font name (Google Fonts preferred)",
    "body_font": "Specific font name",
    "fallback_fonts": "system fallback stack",
    "usage_rules": "When to use each, weights, line heights"
  },
  "visual_style": {
    "photography": "Style direction — lighting, mood, subjects",
    "illustration": "Illustration style — flat, line art, photo-realistic, etc.",
    "design_direction": "Overall design language — minimal, maximalist, retro, etc.",
    "mood": "Emotional mood — energetic, calm, mysterious, joyful"
  },

  "logo_usage_do": ["4-5 specific dos"],
  "logo_usage_dont": ["4-5 specific don'ts"],
  "approved_color_combos": ["3-4 specific colour combinations that work"],
  "typography_hierarchy": "H1 size/weight, H2, body, small — be specific",
  "social_visual_direction": "How posts should look on Instagram/TikTok — feed aesthetics",

  "core_categories": ["3-5 product categories to launch"],
  "hero_products": ["3-4 hero products that define the brand"],
  "future_expansion": ["3-4 future product directions"],
  "launch_collection": ["The first 5-8 SKUs to launch with"],

  "pricing_strategy": {
    "entry_range": "₹X-Y for entry SKUs",
    "core_range": "₹X-Y for core SKUs",
    "premium_range": "₹X-Y for premium SKUs",
    "reasoning": "Why these price points work for the audience"
  },

  "competitors": ["3-5 real or representative competitor brand names"],
  "why_choose_us": "One paragraph on the differentiator",
  "positioning_statement": "For [audience], [brand] is the [category] that [unique value], because [reason]",

  "packaging": {
    "style": "Visual direction for packaging — minimal kraft, premium black, etc.",
    "unboxing_experience": "Step-by-step what the customer experiences when opening",
    "brand_inserts": "What's inside the box — cards, stickers, samples",
    "thank_you_message": "Actual copy for a thank-you card insert",
    "sticker_concepts": "Sticker design ideas"
  },

  "social": {
    "instagram_bio": "Actual bio copy under 150 chars",
    "tiktok_bio": "Actual TikTok bio copy under 80 chars",
    "content_pillars": ["4-5 content categories to post about"],
    "posting_themes": ["6-8 specific post ideas"],
    "hashtags": ["8-12 hashtags — mix of branded, niche, broad"]
  },

  "email_tones": {
    "welcome": "How the welcome email should sound — example opening line",
    "abandoned_cart": "How the abandoned cart email should sound — example opening line",
    "launch": "How a product launch email should sound — example opening line",
    "support": "How customer support emails should sound — example opening line"
  }
}

Now generate the complete Brand Book for ${brand.name}. Make it specific, opinionated, and feel like real agency work.`;

  try {
    const completion = await openrouter.chat.completions.create({
      model: MODELS.smart,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 16000,
      temperature: 0.7,
    });

    const raw = completion.choices[0].message.content || "";
    const json = extractJson(raw);

    if (!json) {
      await supabase.from("brands").update({ brand_book_status: "failed" }).eq("id", brandId);
      console.error("[brand-book] Could not extract JSON. Raw:", raw.slice(0, 500));
      return NextResponse.json({ error: "Generation failed" }, { status: 500 });
    }

    await supabase
      .from("brands")
      .update({ brand_book: json, brand_book_status: "ready" })
      .eq("id", brandId);

    // Award XP for completing the Brand Book.
    awardXP(user.id, "brand_book_ready", { brand_id: brandId })
      .catch(err => console.error("awardXP brand_book_ready failed:", err));

    return NextResponse.json({ brand_book: json, status: "ready" });
  } catch (err) {
    console.error("[brand-book] Generation error:", err);
    await supabase.from("brands").update({ brand_book_status: "failed" }).eq("id", brandId);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

function extractJson(raw: string): unknown | null {
  // Try fenced first.
  const fenced = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  const source = fenced ? fenced[1].trim() : raw.trim();

  // Find the outermost { … } block.
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;

  const candidate = source.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}
