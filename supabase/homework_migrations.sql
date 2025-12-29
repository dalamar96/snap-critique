-- Add Homework Fields to Lessons
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS has_homework BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS learning_goals TEXT;

-- Add Lesson ID to Submissions (Optional FK, set null on delete)
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL;

-- Add Goal Score to Analyses
ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS goal_score INTEGER;

-- Create User Homework Progress Table (Bonus XP)
CREATE TABLE IF NOT EXISTS user_homework_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
    submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
    points_awarded INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE user_homework_progress ENABLE ROW LEVEL SECURITY;

-- Policies for user_homework_progress
CREATE POLICY "Users can view their own homework progress" 
ON user_homework_progress FOR SELECT 
USING (auth.uid() = user_id);

-- Admins (Service Role) have full access (no policy needed for creating if using admin client, 
-- but if using client-side select we need this).
-- Actually strict RLS usually blocks inserts unless policy exists.
-- But our actions use `createAdminClient` for writes typically?
-- `completeLesson` uses `createAdminClient`. `api/analyze` uses `createAdminClient` for writes.
-- So we are good on writes.
