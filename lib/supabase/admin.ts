import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for organiser-only server actions (moderation,
 * threads, clusters). Bypasses RLS once the 0002 lockdown is applied.
 * Falls back to the anon key while SUPABASE_SERVICE_ROLE_KEY isn't
 * provisioned — everything keeps working because pre-lockdown RLS is open.
 * NEVER import this from client components.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
