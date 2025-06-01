-- Drop existing import_sessions table if it exists
drop table if exists public.import_sessions;

-- Create import_sessions table
create table public.import_sessions (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  processed_count integer default 0,
  completed_types text[] default array[]::text[],
  next_page_tokens jsonb default '{}'::jsonb,
  last_processed_at timestamptz default timezone('utc'::text, now()),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'failed')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id)
);

-- Enable Row Level Security
alter table public.import_sessions enable row level security;

-- Create indexes
create index import_sessions_created_at_idx on public.import_sessions (created_at desc);
create index import_sessions_status_idx on public.import_sessions (status);
create index import_sessions_city_idx on public.import_sessions (city);

-- Create policies
create policy "Admins can manage import sessions"
  on public.import_sessions
  for all 
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Create trigger for updated_at
create trigger handle_import_sessions_updated_at
  before update on public.import_sessions
  for each row
  execute function handle_updated_at();