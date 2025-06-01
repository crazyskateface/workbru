-- Create import_sessions table
create table if not exists public.import_sessions (
  id uuid default gen_random_uuid() primary key,
  city text not null,
  processed_count integer default 0,
  completed_types jsonb default '[]',
  next_page_tokens jsonb default '{}',
  last_processed_at timestamp with time zone,
  status text default 'in_progress' check (status in ('in_progress', 'completed', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table import_sessions enable row level security;

-- Create policies
create policy "Import sessions are viewable by admins."
  on import_sessions for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Import sessions are insertable by admins."
  on import_sessions for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Import sessions are updatable by admins."
  on import_sessions for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Create trigger to update updated_at
create trigger handle_import_sessions_updated_at
  before update on import_sessions
  for each row
  execute procedure public.handle_updated_at();