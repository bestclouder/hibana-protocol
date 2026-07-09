"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, NOT_ADMIN_MESSAGE } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { PILOT_SPACE_ID } from "@/lib/types";
import type { ActionResult } from "@/lib/actions";

function revalidateLessonPages(lessonId?: string) {
  revalidatePath("/admin/lessons");
  revalidatePath("/admin");
  revalidatePath("/feed");
  if (lessonId) revalidatePath(`/lessons/${lessonId}`);
}

export async function createLesson(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) return { ok: false, message: NOT_ADMIN_MESSAGE };
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return { ok: false, message: "Title is required." };

    const supabase = createAdminClient();
    const { data: last } = await supabase
      .from("lessons")
      .select("sort_order")
      .eq("space_id", PILOT_SPACE_ID)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const { data, error } = await supabase
      .from("lessons")
      .insert({
        space_id: PILOT_SPACE_ID,
        user_id: admin.user!.id,
        title,
        description: String(formData.get("description") ?? "").trim() || null,
        sort_order: (last?.sort_order ?? 0) + 1,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await writeAudit(supabase, {
      action: "lesson.created",
      target_type: "lesson",
      target_id: data.id,
      actor_email: admin.email,
      metadata: { title },
    });

    revalidateLessonPages();
    return { ok: true, message: "Lesson added." };
  } catch (err) {
    console.error("[lesson]", err);
    return { ok: false, message: "Could not add the lesson. Please try again." };
  }
}

export async function updateLesson(input: {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
}): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) return { ok: false, message: NOT_ADMIN_MESSAGE };
    const title = input.title.trim();
    if (!title) return { ok: false, message: "Title is required." };

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("lessons")
      .update({
        title,
        description: input.description.trim() || null,
        sort_order: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
      })
      .eq("id", input.id);
    if (error) throw new Error(error.message);

    await writeAudit(supabase, {
      action: "lesson.updated",
      target_type: "lesson",
      target_id: input.id,
      actor_email: admin.email,
      metadata: { title },
    });

    revalidateLessonPages(input.id);
    return { ok: true, message: "Lesson saved." };
  } catch (err) {
    console.error("[lesson]", err);
    return { ok: false, message: "Could not save the lesson. Please try again." };
  }
}

/**
 * Deletes a lesson. Content tagged with it (sparks, struggles, clusters,
 * reflections, threads) is kept and moved to "no lesson" first, so nothing a
 * student wrote disappears with the lesson.
 */
export async function deleteLesson(input: { id: string }): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) return { ok: false, message: NOT_ADMIN_MESSAGE };
    const supabase = createAdminClient();

    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, title")
      .eq("id", input.id)
      .single();
    if (!lesson) return { ok: false, message: "That lesson no longer exists." };

    for (const table of [
      "spark_posts",
      "struggle_tickets",
      "common_pain_clusters",
      "lesson_reflections",
      "threads",
    ]) {
      const { error } = await supabase
        .from(table)
        .update({ lesson_id: null })
        .eq("lesson_id", input.id);
      // threads may not exist yet; every other failure must stop the delete
      if (error && table !== "threads") throw new Error(`${table}: ${error.message}`);
    }
    // Child lessons (parent_lesson_id) would block or orphan — detach them too
    await supabase.from("lessons").update({ parent_lesson_id: null }).eq("parent_lesson_id", input.id);

    const { error } = await supabase.from("lessons").delete().eq("id", input.id);
    if (error) throw new Error(error.message);

    await writeAudit(supabase, {
      action: "lesson.deleted",
      target_type: "lesson",
      target_id: input.id,
      actor_email: admin.email,
      metadata: { title: lesson.title },
    });

    revalidateLessonPages(input.id);
    return { ok: true, message: `Lesson "${lesson.title}" deleted — its content moved to "No lesson".` };
  } catch (err) {
    console.error("[lesson]", err);
    return { ok: false, message: "Could not delete the lesson. Please try again." };
  }
}
