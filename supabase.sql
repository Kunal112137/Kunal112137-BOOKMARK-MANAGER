-- supabase.sql
-- Run this in the SQL editor in your Supabase project

-- enable pgcrypto (for gen_random_uuid)
create extension if not exists "pgcrypto";

create table if not exists bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text,
  url text not null,
  created_at timestamptz default now()
);

-- enable row level security
alter table bookmarks enable row level security;

-- allow select only for owner
create policy "Allow users to select their own bookmarks" on bookmarks
  for select using (auth.uid() = user_id);

-- allow insert if user_id matches authenticated user
create policy "Allow logged in users to insert their own bookmarks" on bookmarks
  for insert with check (auth.uid() = user_id);

-- allow delete only by owner
create policy "Allow users to delete their own bookmarks" on bookmarks
  for delete using (auth.uid() = user_id);
