"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, NOT_ADMIN_MESSAGE } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { PILOT_SPACE_ID } from "@/lib/types";
import type { ActionResult } from "@/lib/actions";

/** Organiser renames the community space (e.g. "Hackathon July 2026"). */
export async function updateSpace(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) return { ok: false, message: NOT_ADMIN_MESSAGE };

    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { ok: false, message: "The space name is required." };

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("course_spaces")
      .update({
        name: name.slice(0, 80),
        description: String(formData.get("description") ?? "").trim().slice(0, 300) || null,
      })
      .eq("id", PILOT_SPACE_ID);
    if (error) throw new Error(error.message);

    await writeAudit(supabase, {
      action: "space.updated",
      target_type: "course_space",
      target_id: PILOT_SPACE_ID,
      actor_email: admin.email,
      metadata: { name },
    });

    revalidatePath("/", "layout");
    return { ok: true, message: `Space renamed to "${name}".` };
  } catch (err) {
    console.error("[space]", err);
    return { ok: false, message: "Could not update the space. Please try again." };
  }
}
