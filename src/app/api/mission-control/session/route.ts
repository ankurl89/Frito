import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStaff } from "@/lib/mission-control/auth";

/**
 * GET /api/mission-control/session — used by the staff login to decide, after
 * authentication, whether this account is actually a staff member. Returns
 * whether there's a session at all (so the login can show "no admin access"
 * to a logged-in customer) and the staff role if any.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const staff = user ? await getStaff() : null;
  return NextResponse.json({
    authenticated: !!user,
    isStaff: !!staff,
    role: staff?.role ?? null,
  });
}
