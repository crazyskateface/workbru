-- Enable PostGIS extension
create extension if not exists postgis;

-- Create workspaces table
create table if not exists public.workspaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  address text not null,
  location geography(point) not null,
  amenities jsonb not null default '{
    "wifi": false,
    "coffee": false,
    "outlets": false,
    "seating": false,
    "food": false,
    "meetingRooms": false
  }',
  attributes jsonb not null default '{
    "parking": "none",
    "capacity": "medium",
    "noiseLevel": "moderate",
    "seatingComfort": 3,
    "rating": null,
    "openLate": false,
    "coffeeRating": null
  }',
  opening_hours jsonb,
  photos text[],
  google_place_id text,
  is_public boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table workspaces enable row level security;

-- Create indexes
create index workspaces_location_idx on workspaces using gist(location);
create index workspaces_created_at_idx on workspaces(created_at desc);

-- Create function to get nearby workspaces
create or replace function public.get_nearby_workspaces(
  lat double precision,
  lng double precision,
  radius_km double precision
)
returns table (
  id uuid,
  name text,
  description text,
  address text,
  location jsonb,
  amenities jsonb,
  attributes jsonb,
  opening_hours jsonb,
  photos text[],
  google_place_id text,
  is_public boolean,
  created_by uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  distance double precision
)
language plpgsql
security definer
as $$
begin
  return query
  select
    w.*,
    st_distance(
      w.location::geography,
      st_makepoint(lng, lat)::geography
    ) / 1000 as distance
  from workspaces w
  where st_dwithin(
    w.location::geography,
    st_makepoint(lng, lat)::geography,
    radius_km * 1000
  )
  and w.is_public = true
  order by distance;
end;
$$;

-- Create policies
create policy "Workspaces are viewable by everyone."
  on workspaces for select
  using (is_public = true or auth.uid() = created_by);

create policy "Users can create workspaces."
  on workspaces for insert
  with check (auth.uid() = created_by);

create policy "Users can update their own workspaces."
  on workspaces for update
  using (auth.uid() = created_by);

create policy "Users can delete their own workspaces."
  on workspaces for delete
  using (auth.uid() = created_by);

-- Create trigger to update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger handle_workspaces_updated_at
  before update on workspaces
  for each row
  execute procedure public.handle_updated_at();