-- Seed Data for Lessons

-- 1. Create a "Fundamentals" Module (Parent)
insert into lessons (slug, title, description, level, points, icon, published, order_index)
values (
  'module-fundamentals',
  'Photography Fundamentals',
  'Master the core concepts of light, composition, and camera settings.',
  'Beginner',
  0, -- Modules might have 0 points themselves, or bonus points?
  'BookOpen',
  true,
  1
) on conflict (slug) do nothing;

-- 2. Create "Composition 101" Lesson (Child of Fundamentals)
with parent as (select id from lessons where slug = 'module-fundamentals')
insert into lessons (slug, title, description, level, points, icon, published, order_index, parent_id)
select 
  'composition-101',
  'Composition 101',
  'Learn the rule of thirds and leading lines.',
  'Beginner',
  50,
  'Grid',
  true,
  1,
  parent.id
from parent
on conflict (slug) do nothing;

-- 3. Create an intermediate placeholder
insert into lessons (slug, title, description, level, points, icon, published, order_index)
values (
  'module-lighting',
  'Mastering Light',
  'Understanding natural and artificial light.',
  'Intermediate',
  0,
  'Sun',
  true,
  2
) on conflict (slug) do nothing;
