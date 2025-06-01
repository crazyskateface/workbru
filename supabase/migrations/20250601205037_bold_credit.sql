-- Create import_sessions table
create table if not exists public.import_sessions (
  id uuid default gen_random_uuid() primary key,
  city text not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'failed')),
  processed_count integer not null default 0,
  completed_types text[] not null default '{}',
  next_page_tokens jsonb not null default '{}',
  error text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id),
  last_processed_at timestamp with time zone
);

-- Enable RLS
alter table import_sessions enable row level security;

-- Create indexes
create index import_sessions_created_at_idx on import_sessions(created_at desc);
create index import_sessions_city_idx on import_sessions(city);

-- Create policies
create policy "Users can view their own import sessions."
  on import_sessions for select
  using (auth.uid() = created_by);

create policy "Users can create import sessions."
  on import_sessions for insert
  with check (auth.uid() = created_by);

create policy "Users can update their own import sessions."
  on import_sessions for update
  using (auth.uid() = created_by);

-- Create function to handle updated_at
create trigger handle_import_sessions_updated_at
  before update on import_sessions
  for each row
  execute procedure public.handle_updated_at();