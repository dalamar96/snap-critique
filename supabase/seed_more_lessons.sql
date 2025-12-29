-- Add Lesson 2 and 3 to "Photography Fundamentals"

with parent as (select id from lessons where slug = 'module-fundamentals')
insert into lessons (slug, title, description, level, points, icon, published, order_index, parent_id)
select 
  'understanding-aperture',
  'Understanding Aperture',
  'Master depth of field and f-stops for creative control.',
  'Beginner',
  50,
  'Aperture',
  true,
  2,
  parent.id
from parent
union all
select 
  'shutter-speed-basics',
  'Shutter Speed Basics',
  'Freeze motion or create light trails with time control.',
  'Beginner',
  50,
  'Timer',
  true,
  3,
  parent.id
from parent
on conflict (slug) do nothing;
