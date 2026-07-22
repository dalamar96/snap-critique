-- Check table definition
select column_name, data_type, udt_name 
from information_schema.columns 
where table_name = 'comments';

-- Check enum values if udt_name is custom
select t.typname, e.enumlabel
from pg_type t
join pg_enum e on t.oid = e.enumtypid
where t.typname = 'comment_type';
