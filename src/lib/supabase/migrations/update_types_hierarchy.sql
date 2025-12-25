-- 1. Truncate table
truncate table photography_types cascade;

-- 2. Add Columns
alter table photography_types 
  add column if not exists slug text,
  add column if not exists parent_id uuid references photography_types(id),
  add column if not exists sort_order integer default 0;

-- 3. Add constraint (optional but good)
alter table photography_types drop constraint if exists photography_types_slug_key;
alter table photography_types add constraint photography_types_slug_key unique (slug);
