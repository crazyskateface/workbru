/*
  # Add import sessions table

  1. New Tables
    - `import_sessions`
      - `id` (uuid, primary key)
      - `city` (text)
      - `processed_count` (integer)
      - `completed_types` (text[])
      - `next_page_tokens` (jsonb)
      - `last_processed_at` (timestamptz)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `import_sessions` table
    - Add policies for authenticated admin users to manage import sessions
*/

-- Create the import_sessions table
CREATE TABLE IF NOT EXISTS public.import_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    city text NOT NULL,
    processed_count integer DEFAULT 0,
    completed_types text[] DEFAULT ARRAY[]::text[],
    next_page_tokens jsonb DEFAULT '{}'::jsonb,
    last_processed_at timestamptz,
    status text NOT NULL DEFAULT 'in_progress',
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT import_sessions_status_check CHECK (status IN ('in_progress', 'completed', 'failed'))
);

-- Enable Row Level Security
ALTER TABLE public.import_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage import sessions
CREATE POLICY "Admins can manage import sessions"
    ON public.import_sessions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Add updated_at trigger
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.import_sessions
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Create index on created_at for efficient ordering
CREATE INDEX IF NOT EXISTS import_sessions_created_at_idx ON public.import_sessions (created_at DESC);