"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, NOT_ADMIN_MESSAGE } from "@/lib/auth";
import { tryUploadImage } from "@/lib/upload";
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

    const upload = await tryUploadImage(formData.get("image"));
    const { data, error } = await supabase
      .from("lessons")
      .insert({
        space_id: PILOT_SPACE_ID,
        user_id: admin.user!.id,
        title,
        description: String(formData.get("description") ?? "").trim() || null,
        sort_order: (last?.sort_order ?? 0) + 1,
        image_url: upload.url ?? (String(formData.get("image_url") ?? "").trim() || null),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Every lesson gets a standing discussion thread
    await supabase.from("threads").insert({
      space_id: PILOT_SPACE_ID,
      lesson_id: data.id,
      title,
      body: "Open discussion for this lesson — share takeaways, ask questions.",
      kind: "lesson",
    });

    await writeAudit(supabase, {
      action: "lesson.created",
      target_type: "lesson",
      target_id: data.id,
      actor_email: admin.email,
      metadata: { title },
    });

    revalidateLessonPages();
    return { ok: true, message: `Lesson added.${upload.note ? ` (${upload.note})` : ""}` };
  } catch (err) {
    console.error("[lesson]", err);
    return { ok: false, message: "Could not add the lesson. Please try again." };
  }
}

export async function updateLesson(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) return { ok: false, message: NOT_ADMIN_MESSAGE };
    const id = String(formData.get("lesson_id") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    if (!id) return { ok: false, message: "Missing lesson reference." };
    if (!title) return { ok: false, message: "Title is required." };
    const sortOrder = parseInt(String(formData.get("sort_order") ?? ""), 10);

    const supabase = createAdminClient();
    const { data: current } = await supabase
      .from("lessons")
      .select("image_url")
      .eq("id", id)
      .single();

    // Image precedence: new upload > pasted URL > keep current; the remove
    // checkbox clears it (unless a replacement was provided)
    const upload = await tryUploadImage(formData.get("image"));
    const removeImage = formData.get("remove_image") === "on";
    const imageUrl =
      upload.url ??
      (String(formData.get("image_url") ?? "").trim() || null) ??
      (removeImage ? null : (current?.image_url ?? null));

    const { error } = await supabase
      .from("lessons")
      .update({
        title,
        description: String(formData.get("description") ?? "").trim() || null,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
        image_url: imageUrl,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);

    // Keep the lesson's discussion thread title in sync
    await supabase
      .from("threads")
      .update({ title })
      .eq("lesson_id", id)
      .eq("kind", "lesson");

    await writeAudit(supabase, {
      action: "lesson.updated",
      target_type: "lesson",
      target_id: id,
      actor_email: admin.email,
      metadata: { title },
    });

    revalidateLessonPages(id);
    return { ok: true, message: `Lesson saved.${upload.note ? ` (${upload.note})` : ""}` };
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

    // The lesson's own discussion thread goes with it (replies included);
    // organiser topics that merely reference the lesson are kept and detached
    const { data: lessonThreads } = await supabase
      .from("threads")
      .select("id")
      .eq("lesson_id", input.id)
      .eq("kind", "lesson");
    for (const t of lessonThreads ?? []) {
      await supabase.from("comments").delete().eq("target_id", t.id);
      await supabase.from("threads").delete().eq("id", t.id);
    }

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
      if (error) throw new Error(`${table}: ${error.message}`);
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
