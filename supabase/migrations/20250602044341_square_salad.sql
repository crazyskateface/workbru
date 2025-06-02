-- Create a function to update users (bypasses RLS)
CREATE OR REPLACE FUNCTION admin_update_user(
  user_id UUID,
  user_email TEXT DEFAULT NULL,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  user_role TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
BEGIN
  -- Update the profile
  UPDATE profiles SET
    email = COALESCE(user_email, profiles.email),
    first_name = COALESCE(p_first_name, profiles.first_name),
    last_name = COALESCE(p_last_name, profiles.last_name),
    role = COALESCE(user_role, profiles.role),
    updated_at = NOW()
  WHERE profiles.id = user_id;
  
  -- If no rows were updated, insert a new profile
  IF NOT FOUND THEN
    INSERT INTO profiles (id, email, first_name, last_name, role, created_at, updated_at)
    VALUES (user_id, user_email, p_first_name, p_last_name, COALESCE(user_role, 'user'), NOW(), NOW());
  END IF;
  
  -- Return the updated/inserted profile
  RETURN QUERY
  SELECT p.id, p.email, p.first_name, p.last_name, p.role, p.avatar_url, p.created_at, p.updated_at
  FROM profiles p
  WHERE p.id = user_id;
END;
$$;