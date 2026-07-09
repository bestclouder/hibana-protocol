# Data Model

## course_spaces
`id` uuid PK | `user_id` uuid nullable | `created_at` timestamptz | `name` text | `description` text | `invite_code` text unique

## lessons
`id` uuid PK | `user_id` uuid nullable | `space_id` → course_spaces | `title` text | `description` text | `sort_order` int | `parent_lesson_id` uuid nullable

## spark_posts
`id` uuid PK | `user_id` uuid nullable | `space_id` → course_spaces | `lesson_id` → lessons | `author_name` text | `author_email` text | `title` text | `description` text | `image_url` text | `external_link` text | `featured` bool default false

## struggle_tickets
`id` uuid PK | `user_id` uuid nullable | `space_id` → course_spaces | `lesson_id` → lessons | `cluster_id` → common_pain_clusters nullable | `ticket_number` text unique (HIB-###) | `author_name` text | `author_email` text | `title` text | `description` text | `image_url` text | `status` text (`open` | `acknowledged` | `linked_to_cluster` | `solution_posted` | `resolved` | `still_stuck` | `closed`) | `resolution_status` text nullable | `solution_url` text | `last_updated_at` timestamptz

## common_pain_clusters
`id` uuid PK | `user_id` uuid nullable | `space_id` → course_spaces | `lesson_id` → lessons | `cluster_number` text unique (COMMON-###) | `title` text | `summary` text | `status` text | `solution_body` text | `solution_posted_at` timestamptz | `affected_student_count` int | `resolution_rate` numeric

## lesson_reflections
`id` uuid PK | `user_id` uuid nullable | `space_id` | `lesson_id` | `author_name` text | `author_email` text | `main_takeaway` text | `what_was_confusing` text | `confidence_rating` int (1–5) | `public_comment` text

## reactions
`id` uuid PK | `user_id` uuid nullable | `target_id` uuid | `target_type` text (`spark_post` | `struggle_ticket`) | `reactor_name` text | `reactor_email` text | `reaction_type` text (`i_have_this_too` | `this_helped_me` | `still_stuck` | `inspired` | `great_work` | `i_can_help`)

## comments
`id` uuid PK | `user_id` uuid nullable | `target_id` uuid | `target_type` text | `author_name` text | `author_email` text | `body` text

## email_notifications
`id` uuid PK | `user_id` uuid nullable | `cluster_id` → common_pain_clusters | `ticket_id` → struggle_tickets | `recipient_email` text | `recipient_name` text | `email_type` text | `sent_at` timestamptz | `status` text (`pending` | `sent` | `failed`)

## audit_logs
`id` uuid PK | `user_id` uuid nullable | `action` text | `target_type` text | `target_id` uuid | `actor_email` text | `metadata` jsonb

## RLS
All tables: v1 open permissive policies (select + all for everyone). Replaced with `auth.uid() = user_id` in the Lock it down sprint.

## AI fields (none in v1)
When AI clustering is added: `cluster_suggestion` text + `cluster_suggestion_source` text + `cluster_suggestion_confidence` numeric + `cluster_suggestion_review_status` text default `'unreviewed'` on `struggle_tickets`.