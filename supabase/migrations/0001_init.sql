create table if not exists course_spaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  name text not null,
  description text,
  invite_code text unique not null default substring(gen_random_uuid()::text, 1, 8)
);
alter table course_spaces enable row level security;
drop policy if exists "course_spaces_v1_read" on course_spaces;
create policy "course_spaces_v1_read" on course_spaces for select using (true);
drop policy if exists "course_spaces_v1_write" on course_spaces;
create policy "course_spaces_v1_write" on course_spaces for all using (true) with check (true);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  space_id uuid references course_spaces(id),
  title text not null,
  description text,
  sort_order integer not null default 0,
  parent_lesson_id uuid
);
alter table lessons enable row level security;
drop policy if exists "lessons_v1_read" on lessons;
create policy "lessons_v1_read" on lessons for select using (true);
drop policy if exists "lessons_v1_write" on lessons;
create policy "lessons_v1_write" on lessons for all using (true) with check (true);

create table if not exists spark_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  space_id uuid references course_spaces(id),
  lesson_id uuid references lessons(id),
  author_name text not null,
  author_email text,
  title text not null,
  description text,
  image_url text,
  external_link text,
  featured boolean not null default false
);
alter table spark_posts enable row level security;
drop policy if exists "spark_posts_v1_read" on spark_posts;
create policy "spark_posts_v1_read" on spark_posts for select using (true);
drop policy if exists "spark_posts_v1_write" on spark_posts;
create policy "spark_posts_v1_write" on spark_posts for all using (true) with check (true);

create table if not exists struggle_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  space_id uuid references course_spaces(id),
  lesson_id uuid references lessons(id),
  cluster_id uuid,
  ticket_number text unique not null,
  author_name text not null,
  author_email text,
  title text not null,
  description text,
  image_url text,
  status text not null default 'open',
  resolution_status text,
  solution_url text,
  last_updated_at timestamptz not null default now()
);
alter table struggle_tickets enable row level security;
drop policy if exists "struggle_tickets_v1_read" on struggle_tickets;
create policy "struggle_tickets_v1_read" on struggle_tickets for select using (true);
drop policy if exists "struggle_tickets_v1_write" on struggle_tickets;
create policy "struggle_tickets_v1_write" on struggle_tickets for all using (true) with check (true);

create table if not exists common_pain_clusters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  space_id uuid references course_spaces(id),
  lesson_id uuid references lessons(id),
  cluster_number text unique not null,
  title text not null,
  summary text,
  status text not null default 'open',
  solution_body text,
  solution_posted_at timestamptz,
  affected_student_count integer not null default 0,
  resolution_rate numeric
);
alter table common_pain_clusters enable row level security;
drop policy if exists "common_pain_clusters_v1_read" on common_pain_clusters;
create policy "common_pain_clusters_v1_read" on common_pain_clusters for select using (true);
drop policy if exists "common_pain_clusters_v1_write" on common_pain_clusters;
create policy "common_pain_clusters_v1_write" on common_pain_clusters for all using (true) with check (true);

alter table struggle_tickets add constraint fk_cluster foreign key (cluster_id) references common_pain_clusters(id);

create table if not exists lesson_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  space_id uuid references course_spaces(id),
  lesson_id uuid references lessons(id),
  author_name text not null,
  author_email text,
  main_takeaway text,
  what_was_confusing text,
  confidence_rating integer,
  public_comment text
);
alter table lesson_reflections enable row level security;
drop policy if exists "lesson_reflections_v1_read" on lesson_reflections;
create policy "lesson_reflections_v1_read" on lesson_reflections for select using (true);
drop policy if exists "lesson_reflections_v1_write" on lesson_reflections;
create policy "lesson_reflections_v1_write" on lesson_reflections for all using (true) with check (true);

create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  target_id uuid not null,
  target_type text not null,
  reactor_name text,
  reactor_email text,
  reaction_type text not null
);
alter table reactions enable row level security;
drop policy if exists "reactions_v1_read" on reactions;
create policy "reactions_v1_read" on reactions for select using (true);
drop policy if exists "reactions_v1_write" on reactions;
create policy "reactions_v1_write" on reactions for all using (true) with check (true);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  target_id uuid not null,
  target_type text not null,
  author_name text not null,
  author_email text,
  body text not null
);
alter table comments enable row level security;
drop policy if exists "comments_v1_read" on comments;
create policy "comments_v1_read" on comments for select using (true);
drop policy if exists "comments_v1_write" on comments;
create policy "comments_v1_write" on comments for all using (true) with check (true);

create table if not exists email_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  cluster_id uuid references common_pain_clusters(id),
  ticket_id uuid references struggle_tickets(id),
  recipient_email text not null,
  recipient_name text,
  email_type text not null,
  sent_at timestamptz,
  status text not null default 'pending'
);
alter table email_notifications enable row level security;
drop policy if exists "email_notifications_v1_read" on email_notifications;
create policy "email_notifications_v1_read" on email_notifications for select using (true);
drop policy if exists "email_notifications_v1_write" on email_notifications;
create policy "email_notifications_v1_write" on email_notifications for all using (true) with check (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  created_at timestamptz not null default now(),
  action text not null,
  target_type text,
  target_id uuid,
  actor_email text,
  metadata jsonb
);
alter table audit_logs enable row level security;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

insert into course_spaces (id, name, description, invite_code) values
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Academy of AI Student Community', 'The official AOAI student space for sharing wins, struggles, and learning together.', 'AOAI2024');

insert into lessons (id, space_id, title, description, sort_order) values
  ('b1000000-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Lesson 1: Intro to AI Tools', 'Overview of the AI landscape and the tools we will use throughout the course.', 1),
  ('b1000000-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'Lesson 2: Prompting Basics', 'Core techniques for writing effective prompts across different AI models.', 2),
  ('b1000000-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'Lesson 3: Building an AI Workflow', 'Combining tools and prompts into a repeatable, reliable AI workflow.', 3),
  ('b1000000-0000-0000-0000-000000000004', 'a1b2c3d4-0000-0000-0000-000000000001', 'Lesson 4: Automation Setup', 'Connecting AI outputs to automation platforms to save time at scale.', 4);

insert into spark_posts (id, space_id, lesson_id, author_name, author_email, title, description, featured) values
  ('c1000000-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'Maria Santos', 'maria@example.com', 'Built my first AI research assistant workflow!', 'I combined GPT-4 with Notion and now my research process takes 20 minutes instead of 3 hours. Here is the screenshot of the output.', true),
  ('c1000000-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'James Okafor', 'james@example.com', 'Finally cracked the system prompt structure', 'After re-reading the lesson and experimenting for an hour, my prompts are now giving consistent outputs. Sharing my template here.', false),
  ('c1000000-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', 'Priya Nair', 'priya@example.com', 'Automated my weekly report with Make + ChatGPT', 'My weekly client report now writes itself every Monday morning. Took 2 hours to set up, saves 3 hours every week.', true);

insert into common_pain_clusters (id, space_id, lesson_id, cluster_number, title, summary, status, affected_student_count) values
  ('d1000000-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'COMMON-001', 'API key connection fails in Lesson 3', 'Multiple students cannot connect their OpenAI API key when setting up the workflow in Lesson 3. Error appears to be a quota or formatting issue.', 'open', 3);

insert into struggle_tickets (id, space_id, lesson_id, cluster_id, ticket_number, author_name, author_email, title, description, status) values
  ('e1000000-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'HIB-001', 'Maria Santos', 'maria@example.com', 'Cannot connect my API key in Lesson 3', 'I followed the instructions exactly but I keep getting a 401 error when trying to connect my OpenAI API key. I have checked the key is correct.', 'linked_to_cluster'),
  ('e1000000-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001', 'HIB-002', 'James Okafor', 'james@example.com', 'API key keeps saying invalid even though I copied it correctly', 'My API key from OpenAI shows as invalid. I have regenerated it twice. The workflow builder rejects it every time.', 'linked_to_cluster'),
  ('e1000000-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', null, 'HIB-003', 'Priya Nair', 'priya@example.com', 'Not sure when to use system prompt vs user prompt', 'The lesson explains both but I am confused about which one to use for my specific use case. Can anyone clarify?', 'open'),
  ('e1000000-0000-0000-0000-000000000004', 'a1b2c3d4-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', null, 'HIB-004', 'David Kim', 'david@example.com', 'Make scenario not triggering automatically', 'I set up the Make automation but it only runs when I click Run manually. The schedule trigger does not seem to work.', 'open');

insert into reactions (target_id, target_type, reactor_name, reaction_type) values
  ('e1000000-0000-0000-0000-000000000001', 'struggle_ticket', 'Priya Nair', 'i_have_this_too'),
  ('e1000000-0000-0000-0000-000000000001', 'struggle_ticket', 'David Kim', 'i_have_this_too'),
  ('e1000000-0000-0000-0000-000000000003', 'struggle_ticket', 'James Okafor', 'i_have_this_too'),
  ('c1000000-0000-0000-0000-000000000001', 'spark_post', 'David Kim', 'inspired'),
  ('c1000000-0000-0000-0000-000000000001', 'spark_post', 'James Okafor', 'great_work');