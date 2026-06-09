import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { awardXP } from "@/lib/founder-engine";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Auto-generate a unique slug from the brand name.
  const slug = await uniqueSlug(supabase, body.name);

  const { data, error } = await supabase
    .from("brands")
    .insert({ ...body, user_id: user.id, slug })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Award founder XP — fire-and-forget so the response stays fast.
  awardXP(user.id, "brand_created", { brand_id: data.id, brand_name: data.name })
    .catch(err => console.error("awardXP brand_created failed:", err));

  return NextResponse.json(data);
}

/**
 * Make a kebab-case slug from the name and ensure it's unique by appending
 * `-2`, `-3` etc. as needed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function uniqueSlug(supabase: any, name: string): Promise<string> {
  const base = (name || "brand")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "brand";
  let candidate = base;
  let n = 2;
  while (true) {
    const { data } = await supabase.from("brands").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${n++}`;
    if (n > 50) return `${base}-${Date.now()}`;
  }
}
