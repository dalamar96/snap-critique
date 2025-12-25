select column_name, column_default 
from information_schema.columns 
where table_name = 'comments';
