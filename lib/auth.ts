import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Sole-organiser model: emails listed in ADMIN_EMAILS (comma-separated,
 * server-side env) are admins. Everyone else is a student.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

/**
 * Per-request cached: the layout and the page both ask for the session, and
 * without cache() each ask is a separate auth-server round trip.
 */
export const getSessionUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export interface Identity {
  user: User | null;
  name: string | null;
  email: string | null;
  isAdmin: boolean;
}

export async function getIdentity(): Promise<Identity> {
  const user = await getSessionUser();
  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    null;
  return {
    user,
    name: user ? name : null,
    email: user?.email ?? null,
    isAdmin: isAdminEmail(user?.email),
  };
}

/** Guard for admin-only server actions. Returns null when not the organiser. */
export async function requireAdmin(): Promise<Identity | null> {
  const identity = await getIdentity();
  return identity.isAdmin ? identity : null;
}

export const NOT_ADMIN_MESSAGE = "Only the organiser can do that. Sign in with the organiser account.";
