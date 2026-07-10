export type TicketStatus =
  | "open"
  | "acknowledged"
  | "linked_to_cluster"
  | "solution_posted"
  | "resolved"
  | "still_stuck"
  | "closed";

export type ReactionType =
  | "i_have_this_too"
  | "this_helped_me"
  | "still_stuck"
  | "inspired"
  | "great_work"
  | "i_can_help";

export type TargetType = "spark_post" | "struggle_ticket";

export interface CourseSpace {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_at: string;
}

export interface Lesson {
  id: string;
  space_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  parent_lesson_id: string | null;
  created_at: string;
}

export interface SparkPost {
  id: string;
  space_id: string;
  lesson_id: string | null;
  author_name: string;
  author_email: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  external_link: string | null;
  featured: boolean;
  created_at: string;
}

export interface StruggleTicket {
  id: string;
  space_id: string;
  lesson_id: string | null;
  cluster_id: string | null;
  ticket_number: string;
  author_name: string;
  author_email: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  status: TicketStatus;
  resolution_status: string | null;
  solution_url: string | null;
  cluster_suggestion: string | null;
  cluster_suggestion_source: string | null;
  cluster_suggestion_confidence: number | null;
  cluster_suggestion_reason: string | null;
  cluster_suggestion_review_status: string;
  last_updated_at: string;
  created_at: string;
}

export interface CommonPainCluster {
  id: string;
  space_id: string;
  lesson_id: string | null;
  cluster_number: string;
  title: string;
  summary: string | null;
  status: string;
  solution_body: string | null;
  solution_posted_at: string | null;
  affected_student_count: number;
  resolution_rate: number | null;
  created_at: string;
}

export interface Reaction {
  id: string;
  target_id: string;
  target_type: TargetType;
  reactor_name: string | null;
  reactor_email: string | null;
  reaction_type: ReactionType;
  created_at: string;
}

export interface Comment {
  id: string;
  target_id: string;
  target_type: TargetType;
  author_name: string;
  author_email: string | null;
  body: string;
  created_at: string;
}

export interface LessonReflection {
  id: string;
  space_id: string;
  lesson_id: string | null;
  author_name: string;
  author_email: string | null;
  main_takeaway: string | null;
  what_was_confusing: string | null;
  confidence_rating: number | null;
  public_comment: string | null;
  created_at: string;
}

export interface Thread {
  id: string;
  user_id: string | null;
  space_id: string;
  lesson_id: string | null;
  title: string;
  body: string | null;
  pinned: boolean;
  locked: boolean;
  kind: "topic" | "lesson";
  created_at: string;
}

export interface EmailNotification {
  id: string;
  cluster_id: string | null;
  ticket_id: string | null;
  recipient_email: string;
  recipient_name: string | null;
  email_type: string;
  sent_at: string | null;
  status: "pending" | "sent" | "failed";
  created_at: string;
}

/** The single AOAI pilot space (seeded by 0001_init.sql). */
export const PILOT_SPACE_ID = "a1b2c3d4-0000-0000-0000-000000000001";

export const REACTION_LABELS: Record<ReactionType, string> = {
  i_have_this_too: "I have this too",
  this_helped_me: "This helped me",
  still_stuck: "Still stuck",
  inspired: "Inspired",
  great_work: "Great work",
  i_can_help: "I can help",
};

export const REACTION_EMOJI: Record<ReactionType, string> = {
  i_have_this_too: "🙋",
  this_helped_me: "💡",
  still_stuck: "🌀",
  inspired: "✨",
  great_work: "👏",
  i_can_help: "🤝",
};

export const SPARK_REACTIONS: ReactionType[] = [
  "inspired",
  "great_work",
  "this_helped_me",
];

export const STRUGGLE_REACTIONS: ReactionType[] = [
  "i_have_this_too",
  "i_can_help",
  "this_helped_me",
  "still_stuck",
];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  linked_to_cluster: "Linked to cluster",
  solution_posted: "Solution posted",
  resolved: "Resolved",
  still_stuck: "Still stuck",
  closed: "Closed",
};
