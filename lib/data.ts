import { createClient } from "@/lib/supabase/server";
import {
  PILOT_SPACE_ID,
  type Comment,
  type CommonPainCluster,
  type CourseSpace,
  type Lesson,
  type LessonReflection,
  type Reaction,
  type SparkPost,
  type StruggleTicket,
} from "@/lib/types";

export async function getSpace(): Promise<CourseSpace | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("course_spaces")
    .select("*")
    .eq("id", PILOT_SPACE_ID)
    .single();
  return data;
}

export async function getLessons(): Promise<Lesson[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("space_id", PILOT_SPACE_ID)
    .order("sort_order");
  if (error) throw new Error(`Could not load lessons: ${error.message}`);
  return data ?? [];
}

export async function getLesson(id: string): Promise<Lesson | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("lessons").select("*").eq("id", id).single();
  return data;
}

export async function getSparks(lessonId?: string): Promise<SparkPost[]> {
  const supabase = await createClient();
  let query = supabase
    .from("spark_posts")
    .select("*")
    .eq("space_id", PILOT_SPACE_ID)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (lessonId) query = query.eq("lesson_id", lessonId);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load sparks: ${error.message}`);
  return data ?? [];
}

export async function getSpark(id: string): Promise<SparkPost | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("spark_posts").select("*").eq("id", id).single();
  return data;
}

export async function getTickets(opts?: {
  lessonId?: string;
  status?: string;
  clusterId?: string;
}): Promise<StruggleTicket[]> {
  const supabase = await createClient();
  let query = supabase
    .from("struggle_tickets")
    .select("*")
    .eq("space_id", PILOT_SPACE_ID)
    .order("created_at", { ascending: false });
  if (opts?.lessonId) query = query.eq("lesson_id", opts.lessonId);
  if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.clusterId) query = query.eq("cluster_id", opts.clusterId);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load struggles: ${error.message}`);
  return data ?? [];
}

export async function getTicket(id: string): Promise<StruggleTicket | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("struggle_tickets")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function getClusters(): Promise<CommonPainCluster[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("common_pain_clusters")
    .select("*")
    .eq("space_id", PILOT_SPACE_ID)
    .order("affected_student_count", { ascending: false });
  if (error) throw new Error(`Could not load clusters: ${error.message}`);
  return data ?? [];
}

export async function getCluster(id: string): Promise<CommonPainCluster | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("common_pain_clusters")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

/** Reactions for a set of targets, grouped by target then type. */
export async function getReactionCounts(
  targetIds: string[],
): Promise<Record<string, Record<string, number>>> {
  if (targetIds.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("reactions")
    .select("target_id, reaction_type")
    .in("target_id", targetIds);
  const counts: Record<string, Record<string, number>> = {};
  for (const row of data ?? []) {
    counts[row.target_id] ??= {};
    counts[row.target_id][row.reaction_type] =
      (counts[row.target_id][row.reaction_type] ?? 0) + 1;
  }
  return counts;
}

export async function getReactions(targetId: string): Promise<Reaction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reactions")
    .select("*")
    .eq("target_id", targetId)
    .order("created_at");
  return data ?? [];
}

export async function getComments(targetId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select("*")
    .eq("target_id", targetId)
    .order("created_at");
  return data ?? [];
}

export async function getReflections(lessonId: string): Promise<LessonReflection[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lesson_reflections")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
