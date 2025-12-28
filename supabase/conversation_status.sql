CREATE TABLE conversation_status (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    status TEXT CHECK (status IN ('open', 'resolved')) DEFAULT 'open',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy (if RLS is enabled, but we mostly use admin client on server actions for this)
-- ALTER TABLE conversation_status ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own status" ON conversation_status FOR SELECT USING (auth.uid() = user_id);
