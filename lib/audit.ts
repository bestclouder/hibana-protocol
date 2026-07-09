import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Every state-changing action writes an audit row (docs/SECURITY.md).
 * Append-only: nothing in the app ever updates or deletes audit_logs.
 */
export async function writeAudit(
  supabase: SupabaseClient,
  entry: {
    action: string;
    target_type?: string;
    target_id?: string;
    actor_email?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const { error } = await supabase.from("audit_logs").insert({
    action: entry.action,
    target_type: entry.target_type ?? null,
    target_id: entry.target_id ?? null,
    actor_email: entry.actor_email ?? null,
    metadata: entry.metadata ?? null,
  });
  if (error) console.error("[audit] failed to write audit log:", error.message);
}
