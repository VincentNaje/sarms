import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. BYPASSES Row Level Security.
 *
 * The "server-only" import above guarantees this file throws a build
 * error if it's ever accidentally imported into a Client Component --
 * this key must never reach the browser.
 *
 * Used exclusively for the sarms.login_attempts table, which has no
 * RLS policy at all (see sarms_schema.sql) and is intentionally only
 * reachable through this admin client.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: "sarms" },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
