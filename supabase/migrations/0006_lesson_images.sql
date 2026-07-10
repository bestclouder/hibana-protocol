-- Lessons can carry an explainer image/screenshot, shown on the lesson page
-- and its discussion thread.
alter table lessons add column if not exists image_url text;
