-- Drop bad constraint 
ALTER TABLE comments DROP CONSTRAINT comments_user_id_fkey;

-- Re-add correct constraint pointing to PROFILES
ALTER TABLE comments
ADD CONSTRAINT comments_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles (id)
ON DELETE CASCADE;
