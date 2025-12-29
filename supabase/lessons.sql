-- Create lessons table
create table if not exists lessons (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  description text,
  level text not null check (level in ('Beginner', 'Intermediate', 'Advanced')),
  points int not null default 0,
  icon text, -- Lucide icon name
  parent_id uuid references lessons(id),
  order_index int default 0,
  published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_lesson_progress table
create table if not exists user_lesson_progress (
  user_id uuid references auth.users(id) not null, -- Linking to auth.users implies profiles usually, but auth.users is safer FK
  lesson_id uuid references lessons(id) not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  points_awarded int not null,
  primary key (user_id, lesson_id)
);

-- RLS Policies
alter table lessons enable row level security;
alter table user_lesson_progress enable row level security;

-- Lessons are readable by everyone (or just authenticated?)
-- Let's say authenticated for now as per requirements
create policy "Lessons are viewable by authenticated users"
  on lessons for select
  to authenticated
  using (true);

-- User Progress is viewable only by the user
create policy "Users can view their own progress"
  on user_lesson_progress for select
  to authenticated
  using (auth.uid() = user_id);

-- Only system/admin can insert progress (via server actions usually using service role, but if we want client side...)
-- Actually, we'll use Service Role in Server Actions, so RLS for insert might not be strictly needed for client, but good practice.
-- We will NOT allow direct client inserts for progress to prevent cheating.
