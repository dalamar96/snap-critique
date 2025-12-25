-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Comments are viewable by everyone" 
ON comments FOR SELECT 
USING (true);

-- Allow authenticated users to insert (enforcing user_id match is good practice)
CREATE POLICY "Authenticated users can insert comments" 
ON comments FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" 
ON comments FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- (Optional) Allow admins to delete (requires checking profiles table or checking a claim)
-- For simplicity, the Server Action uses the Service Role (createAdminClient) check or explicit logic. 
-- But since we use standard client in action, we might need an admin policy or just rely on the user check.
-- The server action `deleteComment` currently uses `createClient` (user auth) then checks admin status manually.
-- IF it determines admin, it proceeds. BUT if RLS blocks it, it will fail.
-- FIX: In `deleteComment`, if admin, we should probably use `createAdminClient` (service role) to bypass RLS for the delete operation.
