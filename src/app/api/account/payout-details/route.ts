import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { validatePayoutDetails, toMaskedAccount } from "@/lib/payouts";

/**
 * Payout details (bank + PAN) for the signed-in founder.
 *
 * GET  — masked view of what's on file (never the full account number/PAN).
 * POST — save/replace details; resets status to "submitted" so staff re-verify.
 *
 * The payout_accounts table is service-role-only (RLS, no policies), so this
 * route is the ONLY path to it and always masks what it returns.
 */

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();
  const { data } = await svc.from("payout_accounts").select("*").eq("user_id", user.id).maybeSingle();
  return NextResponse.json(toMaskedAccount(data));
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const details = {
    account_holder: String(body.account_holder || "").trim(),
    account_number: String(body.account_number || "").replace(/\s+/g, ""),
    ifsc: String(body.ifsc || "").trim().toUpperCase(),
    pan: String(body.pan || "").trim().toUpperCase(),
  };

  const invalid = validatePayoutDetails(details);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("payout_accounts")
    .upsert(
      { user_id: user.id, ...details, status: "submitted", updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(toMaskedAccount(data));
}
