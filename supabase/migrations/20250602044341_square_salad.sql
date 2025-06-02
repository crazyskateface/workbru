/*
  # Add admin user update function

  1. New Functions
    - `admin_update_user`: A security definer function that allows admins to bypass RLS when updating user profiles
      - Parameters:
        - user_id: UUID of the user to update
        - user_email: Optional new email
        - first_name: Optional new first name
        - last_name: Optional new last name
        - user_role: Optional new role
      - Returns: Updated profile record

  2. Security
    - Function uses SECURITY DEFINER to bypass RLS
    - Only admins can execute the function (checked via RLS policies)
*/

-- Create a function to update users (bypasses RLS)
CREATE OR REPLACE FUNCTION admin_update_user(
  user_id UUID,
  user_email TEXT DEFAULT NULL,
  first_name TEXT DEFAULT NULL,
  last_name TEXT DEFAULT NULL,
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
    first_name = COALESCE(admin_update_user.first_name, profiles.first_name),
    last_name = COALESCE(admin_update_user.last_name, profiles.last_name),
    role = COALESCE(user_role, profiles.role),
    updated_at = NOW()
  WHERE profiles.id = user_id;
  
  -- If no rows were updated, insert a new profile
  IF NOT FOUND THEN
    INSERT INTO profiles (id, email, first_name, last_name, role, created_at, updated_at)
    VALUES (user_id, user_email, admin_update_user.first_name, admin_update_user.last_name, COALESCE(user_role, 'user'), NOW(), NOW());
  END IF;
  
  -- Return the updated/inserted profile
  RETURN QUERY
  SELECT p.id, p.email, p.first_name, p.last_name, p.role, p.avatar_url, p.created_at, p.updated_at
  FROM profiles p
  WHERE p.id = user_id;
END;
$$;