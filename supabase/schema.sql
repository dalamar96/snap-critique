-- Create tables for Snap Critique

create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  credits_balance int default 0,
  created_at timestamptz default now()
);

create type submission_status as enum ('queued', 'processing', 'done', 'error');

create table public.submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id), -- nullable for guests
  image_path text not null,
  thumbnail_path text,
  category text, 
  goals jsonb, -- array of strings
  context text,
  status submission_status default 'queued',
  created_at timestamptz default now()
);

create table public.analyses (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references public.submissions(id) not null,
  full_critique jsonb, -- The structured AI response
  preview_text text, -- For the paywall
  title text,
  is_unlocked boolean default false,
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.submissions enable row level security;
alter table public.analyses enable row level security;

-- Profiles: Users can see their own
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Submissions: Users can see own, Guests can see if they have the ID (UUID not guessable, but better to restrict)
-- For now, let's allow insert for everyone (anon)
create policy "Anyone can insert submissions" on public.submissions
  for insert with check (true);

create policy "Users can view own submissions" on public.submissions
  for select using ( auth.uid() = user_id );

-- Storage buckets (You need to create 'submissions' bucket in dashboard)
-- insert into storage.buckets (id, name) values ('submissions', 'submissions');

create table public.system_prompts (
  id uuid default gen_random_uuid() primary key,
  version text, -- e.g. "v1.0"
  content text not null,
  is_active boolean default false,
  created_at timestamptz default now()
);

alter table public.system_prompts enable row level security;
-- Only admins (via server-side) should really access this, but for simplicity:
create policy "Anyone can read active prompts" on public.system_prompts
  for select using (true);
