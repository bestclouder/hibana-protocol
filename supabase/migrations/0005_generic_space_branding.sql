-- De-brand the seeded pilot space: this project is a generic mock of an
-- online course community, not affiliated with any real course brand.
update course_spaces
set name = 'The Course Community',
    description = 'The student space for sharing wins, struggles, and learning together.',
    invite_code = 'PILOT2026'
where id = 'a1b2c3d4-0000-0000-0000-000000000001';
