"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions";

export async function signUp(formData: FormData): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { ok: false, message: "Your name is required." };
  if (!email) return { ok: false, message: "Email is required." };
  if (password.length < 8) return { ok: false, message: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback`,
    },
  });
  if (error) return { ok: false, message: error.message };

  const needsConfirmation = !data.session;
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: needsConfirmation
      ? "Account created — check your email for a confirmation link, then sign in."
      : "Welcome to Hibana!",
    data: { needsConfirmation },
  };
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, message: "Email and password are required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      ok: false,
      message:
        error.message === "Invalid login credentials"
          ? "Wrong email or password."
          : error.message,
    };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Signed in." };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/feed");
}
