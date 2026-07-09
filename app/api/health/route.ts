import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Health + config probe. serviceRole reports whether organiser actions can
 * write past RLS: audit_logs is readable only by the service-role key, so a
 * numeric count proves the key is present AND valid. No data is exposed.
 */
export async function GET() {
  let serviceRole = false;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { count, error } = await createAdminClient()
      .from("audit_logs")
      .select("id", { count: "exact", head: true });
    serviceRole = !error && typeof count === "number" && count > 0;
  }
  return NextResponse.json({
    status: "ok",
    serviceRole,
    email: Boolean(process.env.RESEND_API_KEY),
    payments: Boolean(process.env.STRIPE_SECRET_KEY),
    timestamp: new Date().toISOString(),
  });
}
