import { NextRequest, NextResponse } from "next/server";
import { openrouter, MODELS } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are Frito, an expert AI brand strategist and co-founder. Your job is to help aspiring entrepreneurs build a real D2C brand through conversation.

You ask smart, focused questions to understand:
- What they want to sell and to whom
- The vibe and positioning of the brand
- Price range they're targeting

After gathering enough info (usually 4-6 exchanges), you generate a complete Brand DNA as a JSON object.

CONVERSATION RULES:
- Be warm, energetic, and encouraging — like a brilliant co-founder who's excited about their idea
- Ask ONE question at a time, never multiple
- Keep responses concise and punchy
- When you have enough information, output ONLY a valid JSON block with this exact structure (no other text):

\`\`\`json
{
  "name": "Brand name",
  "tagline": "Short punchy tagline",
  "story": "2-3 sentence brand story that resonates emotionally",
  "niche": "Specific niche (e.g. anime streetwear, minimalist fitness)",
  "target_audience": "Who buys this (age, interests, mindset)",
  "brand_values": ["value1", "value2", "value3"],
  "voice_tone": "How the brand speaks (e.g. bold and irreverent, calm and premium)",
  "price_tier": "budget|mid|premium|luxury",
  "palette": {
    "primary": "#hexcode",
    "secondary": "#hexcode",
    "accent": "#hexcode",
    "background": "#hexcode",
    "text": "#hexcode"
  },
  "typography": {
    "heading": "Font style description",
    "body": "Font style description",
    "style": "Modern geometric|Classic serif|Playful rounded|etc"
  },
  "logo_prompt": "Detailed DALL-E prompt to generate a logo for this brand"
}
\`\`\`

Start by warmly greeting the user and asking your first question about their idea.`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages } = await req.json();

  const completion = await openrouter.chat.completions.create({
    model: MODELS.smart,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    temperature: 0.8,
    max_tokens: 1500,
  });

  const content = completion.choices[0].message.content || "";

  // Check if response contains completed brand DNA JSON
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      const brandDNA = JSON.parse(jsonMatch[1]);
      return NextResponse.json({ type: "brand_complete", brand: brandDNA });
    } catch {
      // JSON parse failed, treat as regular message
    }
  }

  return NextResponse.json({ type: "message", content });
}
