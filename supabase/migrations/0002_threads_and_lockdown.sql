-- Threads + moderation lockdown (applied via Supabase Management API).
--
-- Model chosen by the organiser:
--   * Feed stays publicly readable; anonymous posting stays allowed.
--   * Signed-in users post as themselves (user_id attached).
--   * Only the organiser (server-side, service-role client) can create
--     threads, delete or move content, or touch clusters/lessons/spaces.
--
-- Enforcement: v1 "for all" open policies are replaced with explicit
-- insert/update policies, and NO delete policies — deletes only happen
-- through the service-role client used by admin server actions.

-- ── Threads: admin-created targeted conversations ────────────────────────────
create table if not exists threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  space_id uuid references course_spaces(id),
  lesson_id uuid references lessons(id),
  title text not null,
  body text,
  pinned boolean not null default false,
  locked boolean not null default false
);
alter table threads enable row level security;
drop policy if exists "threads_read" on threads;
create policy "threads_read" on threads for select using (true);
-- no insert/update/delete policies: service-role (organiser) only

-- ── Content tables: open insert (anon posting stays), no client deletes ─────
-- spark_posts: anyone can post; no client update/delete (featured toggle and
-- moderation go through the service-role client)
drop policy if exists "spark_posts_v1_write" on spark_posts;
create policy "spark_posts_insert" on spark_posts for insert with check (true);

-- struggle_tickets: anyone can post; updates stay open because anonymous
-- reporters must be able to mark their ticket Solved / Still stuck
drop policy if exists "struggle_tickets_v1_write" on struggle_tickets;
create policy "struggle_tickets_insert" on struggle_tickets for insert with check (true);
create policy "struggle_tickets_update" on struggle_tickets for update using (true) with check (true);

-- reactions / comments / reflections: insert only
drop policy if exists "reactions_v1_write" on reactions;
create policy "reactions_insert" on reactions for insert with check (true);
drop policy if exists "comments_v1_write" on comments;
create policy "comments_insert" on comments for insert with check (true);
drop policy if exists "lesson_reflections_v1_write" on lesson_reflections;
create policy "lesson_reflections_insert" on lesson_reflections for insert with check (true);

-- ── Organiser-domain tables: service-role only ───────────────────────────────
drop policy if exists "course_spaces_v1_write" on course_spaces;
drop policy if exists "lessons_v1_write" on lessons;
drop policy if exists "common_pain_clusters_v1_write" on common_pain_clusters;

-- ── Server-only tables ────────────────────────────────────────────────────────
-- email_notifications: written by the notify action (service role); nobody
-- else writes, and reads are no longer public (they contain student emails)
drop policy if exists "email_notifications_v1_write" on email_notifications;
drop policy if exists "email_notifications_v1_read" on email_notifications;

-- audit_logs: append-only from the server, not publicly readable
drop policy if exists "audit_logs_v1_write" on audit_logs;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_insert" on audit_logs for insert with check (true);
