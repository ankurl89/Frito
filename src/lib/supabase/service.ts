import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses RLS.
 *
 * Use ONLY in trusted server contexts that have no authenticated user:
 *   - the job worker
 *   - provider webhooks
 *   - the fulfillment engine / state machine
 *
 * NEVER import this into a route that serves user input without authorization
 * checks, and never ship the service key to the client.
 *
 * Typed as the broad `SupabaseClient` (untyped schema) so query results are
 * permissive — we don't maintain generated DB types in this project.
 */
let cached: SupabaseClient | null = null;

export function createServiceClient(): SupabaseClient {
  if (cached) return cached;
  cached = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  return cached;
}
