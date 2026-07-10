-- Threads become the chat layer: organiser topics plus one standing
-- discussion thread per lesson (takeaways, questions).
alter table threads add column if not exists kind text not null default 'topic';

-- one lesson-thread per lesson
create unique index if not exists threads_one_per_lesson
  on threads (lesson_id) where kind = 'lesson';

-- Backfill: a discussion thread for every existing lesson
insert into threads (space_id, lesson_id, title, body, kind)
select l.space_id, l.id, l.title,
       'Open discussion for this lesson — share takeaways, ask questions.',
       'lesson'
from lessons l
where not exists (
  select 1 from threads t where t.lesson_id = l.id and t.kind = 'lesson'
);
