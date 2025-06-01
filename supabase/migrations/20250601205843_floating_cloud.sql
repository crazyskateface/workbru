-- Create import_sessions table
create table if not exists public.import_sessions (
  id uuid default gen_random_uuid() primary key,
  city text not null,
  radius_km double precision default 5,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  total_places integer default 0,
  processed_places integer default 0,
  error_message text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table import_sessions enable row level security;

-- Create policies
create policy "Import sessions are viewable by everyone."
  on import_sessions for select
  using (true);

create policy "Users can create import sessions."
  on import_sessions for insert
  with check (auth.uid() = created_by);

create policy "Users can update their own import sessions."
  on import_sessions for update
  using (auth.uid() = created_by);

-- Create trigger to update updated_at
create trigger handle_import_sessions_updated_at
  before update on import_sessions
  for each row
  execute procedure public.handle_updated_at();