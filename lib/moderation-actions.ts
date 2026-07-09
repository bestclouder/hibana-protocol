"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, NOT_ADMIN_MESSAGE } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import type { ActionResult } from "@/lib/actions";

export type ModerationTarget = "spark_post" | "struggle_ticket" | "comment" | "thread";

const TABLE: Record<ModerationTarget, string> = {
  spark_post: "spark_posts",
  struggle_ticket: "struggle_tickets",
  comment: "comments",
  thread: "threads",
};

/**
 * Organiser-only content removal (docs/AGENTIC_LAYER.md marks deletion
 * "critical — human only": this action runs solely on an explicit admin
 * click behind a confirm dialog, and every deletion is audit-logged).
 */
export async function deleteContent(input: {
  type: ModerationTarget;
  id: string;
  reason?: string;
}): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) return { ok: false, message: NOT_ADMIN_MESSAGE };
    const supabase = createAdminClient();

    // Snapshot for the audit trail before it disappears
    const { data: row } = await supabase
      .from(TABLE[input.type])
      .select("*")
      .eq("id", input.id)
      .single();
    if (!row) return { ok: false, message: "That content no longer exists." };

    // Cascade dependents
    if (input.type === "spark_post" || input.type === "struggle_ticket" || input.type === "thread") {
      await supabase.from("comments").delete().eq("target_id", input.id);
      await supabase.from("reactions").delete().eq("target_id", input.id);
    }
    if (input.type === "struggle_ticket") {
      await supabase.from("email_notifications").delete().eq("ticket_id", input.id);
    }

    const { error } = await supabase.from(TABLE[input.type]).delete().eq("id", input.id);
    if (error) throw new Error(error.message);

    await writeAudit(supabase, {
      action: "moderation.content_deleted",
      target_type: input.type,
      target_id: input.id,
      actor_email: admin.email,
      metadata: {
        reason: input.reason ?? null,
        snapshot: {
          title: (row as { title?: string }).title ?? null,
          body: (row as { body?: string }).body ?? null,
          author: (row as { author_name?: string }).author_name ?? null,
        },
      },
    });

    revalidatePath("/feed");
    revalidatePath("/threads");
    revalidatePath("/admin");
    revalidatePath("/admin/tickets");
    return { ok: true, message: "Content deleted." };
  } catch (err) {
    console.error("[moderation]", err);
    return { ok: false, message: "Could not delete. Please try again." };
  }
}

/** Organiser moves a spark or ticket to a different lesson. */
export async function moveContent(input: {
  type: "spark_post" | "struggle_ticket";
  id: string;
  lessonId: string | null;
}): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) return { ok: false, message: NOT_ADMIN_MESSAGE };
    const supabase = createAdminClient();

    const { error } = await supabase
      .from(TABLE[input.type])
      .update({ lesson_id: input.lessonId })
      .eq("id", input.id);
    if (error) throw new Error(error.message);

    await writeAudit(supabase, {
      action: "moderation.content_moved",
      target_type: input.type,
      target_id: input.id,
      actor_email: admin.email,
      metadata: { lesson_id: input.lessonId },
    });

    revalidatePath("/feed");
    revalidatePath("/admin/tickets");
    return { ok: true, message: "Moved to the selected lesson." };
  } catch (err) {
    console.error("[moderation]", err);
    return { ok: false, message: "Could not move. Please try again." };
  }
}
