-- Sprint 7 "Lock it down" — NOT YET APPLIED.
--
-- Prereqs (in order):
--   1. Add SUPABASE_SERVICE_ROLE_KEY to Vercel env (needed by server routes
--      once anon writes are revoked) and enable Supabase Auth email/password.
--   2. Build the login/signup + invite flow so students get accounts and
--      user_id is attached to every insert.
--   3. Apply this migration (Supabase SQL editor or `supabase db push`).
--
-- Applying it before the auth UI exists would break the public demo app:
-- anonymous visitors could no longer post Sparks/Struggles.

-- Replace v1 open write policies with owner-scoped policies.
-- Reads stay public: the feed is the product's front door.

-- course_spaces: admin-managed only
drop policy if exists "course_spaces_v1_write" on course_spaces;
create policy "course_spaces_owner_write" on course_spaces
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- lessons: admin-managed only
drop policy if exists "lessons_v1_write" on lessons;
create policy "lessons_owner_write" on lessons
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- spark_posts: authenticated users create their own; owners update/delete
drop policy if exists "spark_posts_v1_write" on spark_posts;
create policy "spark_posts_auth_insert" on spark_posts
  for insert with check (auth.uid() = user_id);
create policy "spark_posts_owner_update" on spark_posts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "spark_posts_owner_delete" on spark_posts
  for delete using (auth.uid() = user_id);

-- struggle_tickets: same pattern
drop policy if exists "struggle_tickets_v1_write" on struggle_tickets;
create policy "struggle_tickets_auth_insert" on struggle_tickets
  for insert with check (auth.uid() = user_id);
create policy "struggle_tickets_owner_update" on struggle_tickets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "struggle_tickets_owner_delete" on struggle_tickets
  for delete using (auth.uid() = user_id);

-- common_pain_clusters: organiser only (service role bypasses RLS; admin
-- routes must use the service-role server client after lockdown)
drop policy if exists "common_pain_clusters_v1_write" on common_pain_clusters;
create policy "common_pain_clusters_owner_write" on common_pain_clusters
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- lesson_reflections
drop policy if exists "lesson_reflections_v1_write" on lesson_reflections;
create policy "lesson_reflections_auth_insert" on lesson_reflections
  for insert with check (auth.uid() = user_id);
create policy "lesson_reflections_owner_update" on lesson_reflections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reactions / comments: authenticated inserts only, no edits
drop policy if exists "reactions_v1_write" on reactions;
create policy "reactions_auth_insert" on reactions
  for insert with check (auth.uid() = user_id);
drop policy if exists "comments_v1_write" on comments;
create policy "comments_auth_insert" on comments
  for insert with check (auth.uid() = user_id);

-- email_notifications: server-side only (service role); no client writes,
-- reads restricted to the owner
drop policy if exists "email_notifications_v1_write" on email_notifications;
drop policy if exists "email_notifications_v1_read" on email_notifications;
create policy "email_notifications_owner_read" on email_notifications
  for select using (auth.uid() = user_id);

-- audit_logs: append-only via server (service role); no client access at all
drop policy if exists "audit_logs_v1_write" on audit_logs;
drop policy if exists "audit_logs_v1_read" on audit_logs;
