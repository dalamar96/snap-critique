ALTER TABLE comments
ADD CONSTRAINT comments_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles (id)
ON DELETE CASCADE;
