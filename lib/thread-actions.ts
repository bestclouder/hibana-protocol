"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, NOT_ADMIN_MESSAGE } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { PILOT_SPACE_ID } from "@/lib/types";
import type { ActionResult } from "@/lib/actions";

/** Organiser creates a targeted conversation thread. */
export async function createThread(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin();
    if (!admin) return { ok: false, message: NOT_ADMIN_MESSAGE };
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return { ok: false, message: "Title is required." };

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("threads")
      .insert({
        space_id: PILOT_SPACE_ID,
        lesson_id: String(formData.get("lesson_id") ?? "").trim() || null,
        user_id: admin.user!.id,
        title,
        body: String(formData.get("body") ?? "").trim() || null,
        pinned: formData.get("pinned") === "on",
      })
      .select("id")
      .single();
    if (error) {
      if (/does not exist|could not find the table/i.test(error.message)) {
        return {
          ok: false,
          message: "The threads table isn't set up in the database yet.",
        };
      }
      throw new Error(error.message);
    }

    await writeAudit(supabase, {
      action: "thread.created",
      target_type: "thread",
      target_id: data.id,
      actor_email: admin.email,
      metadata: { title },
    });

    revalidatePath("/threads");
    return { ok: true, message: "Thread created.", data: { id: data.id } };
  } catch (err) {
    console.error("[thread]", err);
    return { ok: false, message: "Could not create the thread. Please try again." };
  }
}

export async function setThreadFlag(input: {
  threadId: string;
  flag: "pinned" | "locked";
  value: boolean;
}): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) return { ok: false, message: NOT_ADMIN_MESSAGE };
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("threads")
      .update({ [input.flag]: input.value })
      .eq("id", input.threadId);
    if (error) throw new Error(error.message);

    await writeAudit(supabase, {
      action: `thread.${input.flag}_${input.value ? "set" : "unset"}`,
      target_type: "thread",
      target_id: input.threadId,
      actor_email: admin.email,
    });

    revalidatePath("/threads");
    revalidatePath(`/threads/${input.threadId}`);
    return { ok: true, message: "Thread updated." };
  } catch (err) {
    console.error("[thread]", err);
    return { ok: false, message: "Could not update the thread. Please try again." };
  }
}
