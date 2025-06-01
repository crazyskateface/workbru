/*
  # Add import sessions table for workspace imports

  1. New Tables
    - `import_sessions`
      - `id` (uuid, primary key)
      - `city` (text, not null)
      - `processed_count` (integer, default 0)
      - `completed_types` (text array, default empty array)
      - `next_page_tokens` (jsonb, default empty object)
      - `last_processed_at` (timestamptz)
      - `status` (text, with check constraint)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `import_sessions` table
    - Add policies for:
      - Public read access for authenticated users
      - Insert/Update/Delete access for authenticated users with admin role
*/

-- Create import_sessions table
CREATE TABLE IF NOT EXISTS public.import_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  processed_count integer DEFAULT 0,
  completed_types text[] DEFAULT ARRAY[]::text[],
  next_page_tokens jsonb DEFAULT '{}'::jsonb,
  last_processed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT import_sessions_status_check CHECK (status IN ('in_progress', 'completed', 'failed'))
);

-- Enable RLS
ALTER TABLE public.import_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access for authenticated users"
  ON public.import_sessions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all access for admin users"
  ON public.import_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.import_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();