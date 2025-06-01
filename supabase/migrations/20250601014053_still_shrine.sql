CREATE OR REPLACE FUNCTION get_nearby_workspaces(
  lat double precision,
  lng double precision,
  radius_km double precision DEFAULT 5
)
RETURNS TABLE (
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
  created_at timestamptz,
  updated_at timestamptz,
  distance double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.name,
    w.description,
    w.address,
    ST_AsGeoJSON(w.location)::jsonb as location,
    w.amenities,
    w.attributes,
    w.opening_hours,
    w.photos,
    w.google_place_id,
    w.is_public,
    w.created_by,
    w.created_at,
    w.updated_at,
    ST_Distance(
      w.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) / 1000 as distance
  FROM workspaces w
  WHERE ST_DWithin(
    w.location::geography,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_km * 1000
  )
  AND (w.is_public = true OR w.created_by = auth.uid())
  ORDER BY distance;
END;
$$;